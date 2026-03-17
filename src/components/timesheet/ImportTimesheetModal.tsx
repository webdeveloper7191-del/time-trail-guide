import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Timesheet, ClockEntry, BreakEntry } from '@/types/timesheet';
import { locations } from '@/data/mockTimesheets';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Download, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

interface ImportTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (timesheets: Timesheet[]) => void;
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

export function ImportTimesheetModal({ open, onClose, onImport }: ImportTimesheetModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setImporting(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return {
        employeeName: row.employeename || row.name || row.employee || '',
        employeeEmail: row.employeeemail || row.email || '',
        payrollId: row.payrollid || row.payroll || row.employeeid || '',
        department: row.department || row.dept || '',
        position: row.position || row.role || '',
        location: row.location || row.centre || row.center || '',
        date: row.date || '',
        clockIn: row.clockin || row.startime || row.start || '',
        clockOut: row.clockout || row.endtime || row.end || '',
        breakStart: row.breakstart || '',
        breakEnd: row.breakend || '',
        notes: row.notes || '',
      };
    }).filter(r => r.employeeName);
  };

  const parseExcel = async (file: File): Promise<ParsedRow[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any>(sheet);
    return json.map((row: any) => ({
      employeeName: row['Employee Name'] || row['Name'] || row['employee'] || '',
      employeeEmail: row['Email'] || row['Employee Email'] || '',
      payrollId: row['Payroll ID'] || row['Payroll'] || row['Employee ID'] || '',
      department: row['Department'] || row['Dept'] || '',
      position: row['Position'] || row['Role'] || '',
      location: row['Location'] || row['Centre'] || row['Center'] || '',
      date: row['Date'] || '',
      clockIn: row['Clock In'] || row['Start Time'] || row['Start'] || '',
      clockOut: row['Clock Out'] || row['End Time'] || row['End'] || '',
      breakStart: row['Break Start'] || '',
      breakEnd: row['Break End'] || '',
      notes: row['Notes'] || '',
    })).filter((r: ParsedRow) => r.employeeName);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    try {
      let rows: ParsedRow[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        rows = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rows = await parseExcel(file);
      } else {
        toast.error('Unsupported file format. Use CSV or Excel.');
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      rows.forEach((row, i) => {
        if (!row.employeeName) errors.push(`Row ${i + 2}: Missing employee name`);
        if (!row.date) errors.push(`Row ${i + 2}: Missing date`);
        if (!row.clockIn || !row.clockOut) errors.push(`Row ${i + 2}: Missing clock in/out times`);
        if (!row.department) warnings.push(`Row ${i + 2}: No department specified`);
      });

      setPreview({ rows, errors, warnings });
    } catch {
      toast.error('Failed to parse file');
    }
  };

  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    return Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60);
  };

  const handleImport = async () => {
    if (!preview || preview.errors.length > 0) return;
    setImporting(true);

    // Group rows by employee + week
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Timesheets
          </DialogTitle>
          <DialogDescription>Upload a CSV or Excel file to bulk import timesheet entries.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!preview ? (
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
          ) : (
            <>
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {selectedFile?.name.endsWith('.csv') ? (
                  <FileText className="h-8 w-8 text-blue-600" />
                ) : (
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">{preview.rows.length} rows found</p>
                </div>
                <Badge variant="secondary">{preview.errors.length === 0 ? 'Valid' : `${preview.errors.length} errors`}</Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{preview.rows.length}</p>
                  <p className="text-xs text-muted-foreground">Rows</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10">
                  <p className="text-2xl font-bold text-amber-600">{preview.warnings.length}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">{preview.errors.length}</p>
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
                  <p className="text-sm font-medium flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> Warnings
                  </p>
                  <ScrollArea className="h-20 border rounded-lg p-3">
                    {preview.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-600 mb-1">{w}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Preview table */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview (first 5 rows)</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Name</th>
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
                          <td className="p-2">{row.date}</td>
                          <td className="p-2">{row.clockIn}</td>
                          <td className="p-2">{row.clockOut}</td>
                          <td className="p-2">{row.location}</td>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          {preview && (
            <>
              <Button variant="outline" onClick={reset}>Change File</Button>
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
