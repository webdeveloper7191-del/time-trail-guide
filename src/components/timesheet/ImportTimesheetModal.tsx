import { useState, useRef, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timesheet, ClockEntry, BreakEntry } from '@/types/timesheet';
import { locations } from '@/data/mockTimesheets';
import {
  Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Download,
  Folder, ArrowRight, ArrowLeft, Columns3, Sparkles, Link2, Link2Off,
  Search, Filter, XCircle, Eye, Users, Clock, AlertOctagon, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

interface ImportTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (timesheets: Timesheet[]) => void;
}

// ── Target fields ─────────────────────────────────────────────────
interface TargetField {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
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
  targetField: string | null;
  confidence: number;
  autoDetected: boolean;
}

type WizardStep = 'upload' | 'map' | 'validate' | 'import';

// ── Per-row validation ────────────────────────────────────────────
type RowStatus = 'valid' | 'warning' | 'error' | 'duplicate';

interface ValidatedRow {
  index: number; // original CSV row number (1-indexed, +1 for header)
  data: ParsedRow;
  status: RowStatus;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateOf?: number; // row index of first occurrence
}

// ── Fuzzy matching ────────────────────────────────────────────────
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function fuzzyScore(source: string, alias: string): number {
  const s = normalizeHeader(source);
  const a = alias.toLowerCase();
  if (s === a) return 100;
  if (s.includes(a) || a.includes(s)) return 85;
  const sWords = s.split(/\s+/);
  const aWords = a.split(/\s+/);
  const overlap = sWords.filter(w => aWords.includes(w)).length;
  if (overlap > 0) return 50 + (overlap / Math.max(sWords.length, aWords.length)) * 40;
  if (s.startsWith(a.slice(0, 3)) || a.startsWith(s.slice(0, 3))) return 30;
  return 0;
}

function autoDetectMappings(headers: string[]): ColumnMapping[] {
  const usedTargets = new Set<string>();
  const allScores: { headerIdx: number; targetKey: string; score: number }[] = [];
  headers.forEach((h, hi) => {
    TARGET_FIELDS.forEach(tf => {
      const best = Math.max(...tf.aliases.map(a => fuzzyScore(h, a)));
      if (best > 25) allScores.push({ headerIdx: hi, targetKey: tf.key, score: best });
    });
  });
  allScores.sort((a, b) => b.score - a.score);
  const mappings: ColumnMapping[] = headers.map(h => ({
    sourceColumn: h, targetField: null, confidence: 0, autoDetected: false,
  }));
  for (const { headerIdx, targetKey, score } of allScores) {
    if (usedTargets.has(targetKey)) continue;
    if (mappings[headerIdx].targetField !== null) continue;
    mappings[headerIdx] = { sourceColumn: headers[headerIdx], targetField: targetKey, confidence: score, autoDetected: true };
    usedTargets.add(targetKey);
  }
  return mappings;
}

// ── Parsed row ────────────────────────────────────────────────────
interface RawFileData {
  headers: string[];
  rows: Record<string, string>[];
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

// ── COMPONENT ─────────────────────────────────────────────────────
export function ImportTimesheetModal({ open, onClose, onImport }: ImportTimesheetModalProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<RawFileData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RowStatus | 'all'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setSelectedFile(null);
    setRawData(null);
    setMappings([]);
    setValidatedRows([]);
    setImporting(false);
    setProgress(0);
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedRows(new Set());
    setShowDataPreview(false);
    setExpandedErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Step 1: Parse file ──────────────────────────────────────────
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
      toast.success(`${data.rows.length} rows detected across ${data.headers.length} columns.`);
    } catch {
      toast.error('Failed to parse file');
    }
  };

  // ── Step 2: Mapping helpers ─────────────────────────────────────
  const updateMapping = useCallback((index: number, targetField: string | null) => {
    setMappings(prev => {
      const next = [...prev];
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

  // ── Step 2→3: Validate rows ─────────────────────────────────────
  const applyMappingAndValidate = useCallback(() => {
    if (!rawData) return;

    const fieldMap = new Map<string, string>();
    mappings.forEach(m => {
      if (m.targetField) fieldMap.set(m.sourceColumn, m.targetField);
    });

    const parsedRows: ParsedRow[] = rawData.rows.map(rawRow => {
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
    });

    // Validate each row
    const seenKeys = new Map<string, number>(); // duplicate detection key → first row index
    const validated: ValidatedRow[] = parsedRows.map((row, i) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      let isDuplicate = false;
      let duplicateOf: number | undefined;

      // Required field checks
      if (!row.employeeName.trim()) errors.push('Missing employee name');
      if (!row.date.trim()) errors.push('Missing date');
      if (!row.clockIn.trim()) errors.push('Missing clock in time');
      if (!row.clockOut.trim()) errors.push('Missing clock out time');

      // Format checks
      if (row.clockIn && !/^\d{1,2}:\d{2}/.test(row.clockIn)) errors.push('Invalid clock in format (expected HH:MM)');
      if (row.clockOut && !/^\d{1,2}:\d{2}/.test(row.clockOut)) errors.push('Invalid clock out format (expected HH:MM)');

      // Email format check
      if (row.employeeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.employeeEmail)) {
        warnings.push('Invalid email format');
      }

      // Time logic check
      if (row.clockIn && row.clockOut && /^\d{1,2}:\d{2}/.test(row.clockIn) && /^\d{1,2}:\d{2}/.test(row.clockOut)) {
        const [inH, inM] = row.clockIn.split(':').map(Number);
        const [outH, outM] = row.clockOut.split(':').map(Number);
        const totalMins = (outH * 60 + outM) - (inH * 60 + inM);
        if (totalMins <= 0) errors.push('Clock out must be after clock in');
        if (totalMins > 16 * 60) warnings.push('Shift exceeds 16 hours');
      }

      // Optional field warnings
      if (!row.department.trim()) warnings.push('No department specified');
      if (!row.employeeEmail.trim()) warnings.push('No email specified');

      // Duplicate detection
      const dupKey = `${row.employeeName.toLowerCase()}-${row.date}-${row.clockIn}`;
      if (seenKeys.has(dupKey)) {
        isDuplicate = true;
        duplicateOf = seenKeys.get(dupKey);
      } else {
        seenKeys.set(dupKey, i);
      }

      const status: RowStatus = errors.length > 0 ? 'error' : isDuplicate ? 'duplicate' : warnings.length > 0 ? 'warning' : 'valid';

      return { index: i + 2, data: row, status, errors, warnings, isDuplicate, duplicateOf };
    });

    setValidatedRows(validated);
    // Select all importable rows by default
    const importable = new Set(validated.filter(r => r.status !== 'error').map(r => r.index));
    setSelectedRows(importable);
    setStep('validate');
  }, [rawData, mappings]);

  // ── Validation stats ────────────────────────────────────────────
  const validationStats = useMemo(() => {
    const total = validatedRows.length;
    const valid = validatedRows.filter(r => r.status === 'valid').length;
    const warnings = validatedRows.filter(r => r.status === 'warning').length;
    const errors = validatedRows.filter(r => r.status === 'error').length;
    const duplicates = validatedRows.filter(r => r.isDuplicate).length;
    const selected = selectedRows.size;
    const uniqueEmployees = new Set(validatedRows.filter(r => r.data.employeeName).map(r => r.data.employeeName.toLowerCase())).size;
    const uniqueDates = new Set(validatedRows.filter(r => r.data.date).map(r => r.data.date)).size;
    return { total, valid, warnings, errors, duplicates, selected, uniqueEmployees, uniqueDates };
  }, [validatedRows, selectedRows]);

  // ── Filtered rows for display ───────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = validatedRows;
    if (statusFilter !== 'all') {
      rows = rows.filter(r => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r =>
        r.data.employeeName.toLowerCase().includes(q) ||
        r.data.employeeEmail.toLowerCase().includes(q) ||
        r.data.payrollId.toLowerCase().includes(q) ||
        r.data.date.includes(q)
      );
    }
    return rows;
  }, [validatedRows, statusFilter, searchQuery]);

  // ── Row selection helpers ───────────────────────────────────────
  const toggleRow = (rowIndex: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    const importableFiltered = filteredRows.filter(r => r.status !== 'error').map(r => r.index);
    const allSelected = importableFiltered.every(i => selectedRows.has(i));
    setSelectedRows(prev => {
      const next = new Set(prev);
      importableFiltered.forEach(i => allSelected ? next.delete(i) : next.add(i));
      return next;
    });
  };

  // ── Import ──────────────────────────────────────────────────────
  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    return Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60);
  };

  const handleImport = async () => {
    const rowsToImport = validatedRows.filter(r => selectedRows.has(r.index) && r.status !== 'error');
    if (rowsToImport.length === 0) return;

    setImporting(true);
    setStep('import');

    const grouped = new Map<string, ParsedRow[]>();
    rowsToImport.forEach(vr => {
      const row = vr.data;
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
      await new Promise(r => setTimeout(r, 120));
    }

    onImport(timesheets);
    toast.success(`${timesheets.length} timesheet(s) imported from ${rowsToImport.length} rows`);
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const headers = 'Employee Name,Email,Payroll ID,Department,Position,Location,Date,Clock In,Clock Out,Break Start,Break End,Notes';
    const sample1 = 'John Smith,john@company.com,PAY001,Engineering,Developer,Downtown Office,2024-01-08,09:00,17:00,12:00,12:30,';
    const sample2 = 'John Smith,john@company.com,PAY001,Engineering,Developer,Downtown Office,2024-01-09,08:30,16:30,12:00,12:30,Day 2';
    const sample3 = 'Jane Doe,jane@company.com,PAY002,Nursing,RN,Westside Centre,2024-01-08,07:00,15:30,11:30,12:00,Morning shift';
    const blob = new Blob([headers + '\n' + sample1 + '\n' + sample2 + '\n' + sample3], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timesheet_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  // ── Stepper ─────────────────────────────────────────────────────
  const steps: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'Upload', icon: <Upload className="h-4 w-4" /> },
    { key: 'map', label: 'Map Columns', icon: <Columns3 className="h-4 w-4" /> },
    { key: 'validate', label: 'Validate', icon: <Eye className="h-4 w-4" /> },
    { key: 'import', label: 'Import', icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const stepIndex = steps.findIndex(s => s.key === step);

  const statusIcon = (status: RowStatus) => {
    switch (status) {
      case 'valid': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'duplicate': return <Copy className="h-3.5 w-3.5 text-orange-500" />;
    }
  };

  const statusBadge = (status: RowStatus) => {
    const labels: Record<RowStatus, string> = { valid: 'Valid', warning: 'Warning', error: 'Error', duplicate: 'Duplicate' };
    const cls: Record<RowStatus, string> = {
      valid: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      error: 'bg-destructive/10 text-destructive border-destructive/20',
      duplicate: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    };
    return <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border', cls[status])}>{statusIcon(status)} {labels[status]}</span>;
  };

  const confidenceBadge = (confidence: number, autoDetected: boolean) => {
    if (confidence >= 85) return <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/90">{autoDetected ? 'Auto' : 'Manual'} • {confidence}%</Badge>;
    if (confidence >= 50) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-accent">{autoDetected ? 'Auto' : 'Manual'} • {confidence}%</Badge>;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className={cn(
        'max-h-[90vh] overflow-hidden flex flex-col',
        step === 'validate' ? 'max-w-5xl' : 'max-w-2xl',
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Timesheets
          </DialogTitle>
          <DialogDescription>Upload a file, map columns, validate records, then import.</DialogDescription>
        </DialogHeader>

        {/* ── Stepper ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 py-2 flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataPreview(!showDataPreview)}
                  className="text-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  {showDataPreview ? 'Hide' : 'Preview'} Data
                </Button>
              </div>

              {/* Raw data preview toggle */}
              {showDataPreview && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-1.5 border-b">
                    <p className="text-xs font-medium text-muted-foreground">Raw Data Preview (first 5 rows)</p>
                  </div>
                  <div className="overflow-x-auto max-h-[160px]">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          <th className="p-1.5 text-left text-muted-foreground font-medium w-10">#</th>
                          {rawData.headers.map(h => (
                            <th key={h} className="p-1.5 text-left font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawData.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-border/50">
                            <td className="p-1.5 text-muted-foreground">{i + 1}</td>
                            {rawData.headers.map(h => (
                              <td key={h} className="p-1.5 whitespace-nowrap max-w-[150px] truncate">{row[h] || <span className="text-muted-foreground/50">—</span>}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rawData.rows.length > 5 && (
                    <div className="px-3 py-1 border-t bg-muted/30">
                      <p className="text-[10px] text-muted-foreground">… and {rawData.rows.length - 5} more rows</p>
                    </div>
                  )}
                </div>
              )}

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
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-2 px-1 mb-1">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Your Column</p>
                    <div />
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Maps To</p>
                  </div>
                  {mappings.map((mapping, idx) => {
                    const targetField = TARGET_FIELDS.find(tf => tf.key === mapping.targetField);
                    return (
                      <div key={idx} className={cn(
                        'grid grid-cols-[1fr,auto,1fr] gap-2 items-center p-2 rounded-lg border transition-colors',
                        mapping.targetField ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border',
                      )}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-medium truncate">{mapping.sourceColumn}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              e.g. "{rawData.rows[0]?.[mapping.sourceColumn] || '—'}"
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          {mapping.targetField ? (
                            <Link2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Link2Off className="h-4 w-4 text-muted-foreground" />
                          )}
                          {confidenceBadge(mapping.confidence, mapping.autoDetected)}
                        </div>
                        <Select
                          value={mapping.targetField || '__skip__'}
                          onValueChange={(val) => updateMapping(idx, val === '__skip__' ? null : val)}
                        >
                          <SelectTrigger className={cn('h-9 text-sm', !mapping.targetField && 'text-muted-foreground')}>
                            <SelectValue placeholder="Skip this column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__skip__">
                              <span className="text-muted-foreground">— Skip —</span>
                            </SelectItem>
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

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Columns were auto-matched using fuzzy detection. Review and adjust as needed.
              </div>
            </>
          )}

          {/* ── STEP 3: Validate ─────────────────────────────── */}
          {step === 'validate' && validatedRows.length > 0 && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn('text-center p-3 rounded-lg border transition-colors', statusFilter === 'all' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50')}
                >
                  <p className="text-2xl font-bold text-foreground">{validationStats.total}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Total Rows</p>
                </button>
                <button
                  onClick={() => setStatusFilter('valid')}
                  className={cn('text-center p-3 rounded-lg border transition-colors', statusFilter === 'valid' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-muted/30 hover:bg-muted/50')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <p className="text-2xl font-bold text-emerald-600">{validationStats.valid}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Ready</p>
                </button>
                <button
                  onClick={() => setStatusFilter('warning')}
                  className={cn('text-center p-3 rounded-lg border transition-colors', statusFilter === 'warning' ? 'border-amber-500 bg-amber-500/10' : 'border-border bg-muted/30 hover:bg-muted/50')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-2xl font-bold text-amber-600">{validationStats.warnings}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Warnings</p>
                </button>
                <button
                  onClick={() => setStatusFilter('error')}
                  className={cn('text-center p-3 rounded-lg border transition-colors', statusFilter === 'error' ? 'border-destructive bg-destructive/10' : 'border-border bg-muted/30 hover:bg-muted/50')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <p className="text-2xl font-bold text-destructive">{validationStats.errors}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Errors</p>
                </button>
              </div>

              {/* Extra stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {validationStats.uniqueEmployees} employees</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {validationStats.uniqueDates} dates</span>
                {validationStats.duplicates > 0 && (
                  <span className="flex items-center gap-1 text-orange-600"><Copy className="h-3.5 w-3.5" /> {validationStats.duplicates} duplicates</span>
                )}
                <span className="ml-auto font-medium text-primary">{validationStats.selected} selected for import</span>
              </div>

              {/* Search & filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, payroll ID, or date…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                {statusFilter !== 'all' && (
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')} className="h-8 text-xs">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Clear filter
                  </Button>
                )}
              </div>

              {/* Error summary (collapsible) */}
              {validationStats.errors > 0 && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => setExpandedErrors(!expandedErrors)}
                  >
                    <AlertOctagon className="h-4 w-4" />
                    {validationStats.errors} row(s) have errors and cannot be imported
                    <span className="ml-auto">{expandedErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
                  </button>
                  {expandedErrors && (
                    <div className="px-3 pb-2 max-h-[100px] overflow-y-auto">
                      {validatedRows.filter(r => r.status === 'error').map(r => (
                        <div key={r.index} className="text-xs text-destructive/80 py-0.5">
                          Row {r.index}: {r.errors.join('; ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full data table */}
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[320px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10 p-2">
                          <Checkbox
                            checked={filteredRows.filter(r => r.status !== 'error').length > 0 &&
                              filteredRows.filter(r => r.status !== 'error').every(r => selectedRows.has(r.index))}
                            onCheckedChange={toggleAllFiltered}
                          />
                        </TableHead>
                        <TableHead className="w-12 p-2 text-[10px]">Row</TableHead>
                        <TableHead className="w-20 p-2 text-[10px]">Status</TableHead>
                        <TableHead className="p-2 text-[10px]">Employee</TableHead>
                        <TableHead className="p-2 text-[10px]">Email</TableHead>
                        <TableHead className="p-2 text-[10px]">Payroll ID</TableHead>
                        <TableHead className="p-2 text-[10px]">Date</TableHead>
                        <TableHead className="p-2 text-[10px]">Clock In</TableHead>
                        <TableHead className="p-2 text-[10px]">Clock Out</TableHead>
                        <TableHead className="p-2 text-[10px]">Location</TableHead>
                        <TableHead className="p-2 text-[10px]">Issues</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-sm text-muted-foreground">
                            No records match your filter
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRows.map(row => (
                          <TableRow
                            key={row.index}
                            className={cn(
                              'text-xs',
                              row.status === 'error' && 'bg-destructive/5',
                              row.isDuplicate && 'bg-orange-500/5',
                              selectedRows.has(row.index) && row.status !== 'error' && 'bg-primary/5',
                            )}
                          >
                            <TableCell className="p-2">
                              <Checkbox
                                checked={selectedRows.has(row.index)}
                                disabled={row.status === 'error'}
                                onCheckedChange={() => toggleRow(row.index)}
                              />
                            </TableCell>
                            <TableCell className="p-2 text-muted-foreground font-mono">{row.index}</TableCell>
                            <TableCell className="p-2">{statusBadge(row.status)}</TableCell>
                            <TableCell className="p-2 font-medium">{row.data.employeeName || <span className="text-destructive italic">missing</span>}</TableCell>
                            <TableCell className="p-2 text-muted-foreground">{row.data.employeeEmail || '—'}</TableCell>
                            <TableCell className="p-2 text-muted-foreground font-mono">{row.data.payrollId || '—'}</TableCell>
                            <TableCell className="p-2">{row.data.date || <span className="text-destructive italic">missing</span>}</TableCell>
                            <TableCell className="p-2 font-mono">{row.data.clockIn || <span className="text-destructive italic">—</span>}</TableCell>
                            <TableCell className="p-2 font-mono">{row.data.clockOut || <span className="text-destructive italic">—</span>}</TableCell>
                            <TableCell className="p-2">{row.data.location || '—'}</TableCell>
                            <TableCell className="p-2 max-w-[200px]">
                              {row.errors.length > 0 && (
                                <p className="text-destructive truncate" title={row.errors.join('; ')}>{row.errors.join('; ')}</p>
                              )}
                              {row.warnings.length > 0 && (
                                <p className="text-amber-600 truncate" title={row.warnings.join('; ')}>{row.warnings.join('; ')}</p>
                              )}
                              {row.isDuplicate && row.duplicateOf !== undefined && (
                                <p className="text-orange-600 truncate">Duplicate of row {row.duplicateOf + 2}</p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}

          {/* ── STEP 4: Importing ────────────────────────────── */}
          {step === 'import' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold">Importing Timesheets…</p>
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
              <div className="w-full max-w-xs">
                <Progress value={progress} />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>

          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setRawData(null); setMappings([]); setShowDataPreview(false); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={applyMappingAndValidate}
                disabled={requiredFieldsMissing.length > 0}
              >
                Validate Records <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === 'validate' && (
            <>
              <Button variant="outline" onClick={() => { setStep('map'); setValidatedRows([]); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Mapping
              </Button>
              <Button onClick={handleImport} disabled={importing || validationStats.selected === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Import {validationStats.selected} Row{validationStats.selected !== 1 ? 's' : ''}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
