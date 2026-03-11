import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import {
  Upload, FileText, Download, AlertTriangle, CheckCircle2,
  XCircle, Users, Loader2, ArrowRight, ChevronRight, X, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CandidateRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  primaryRole: string;
  employmentType: string;
  payRate: string;
  [key: string]: string;
}

interface ValidationResult {
  row: number;
  field: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
}

interface DuplicateMatch {
  row: number;
  matchedWith: string;
  matchField: 'email' | 'phone' | 'name';
  confidence: number;
}

interface CandidateBulkImportProps {
  open: boolean;
  onClose: () => void;
  onImport?: (candidates: CandidateRow[]) => void;
}

// ─── Field mapping config ────────────────────────────────────────────────────
const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'primaryRole'];

const FIELD_OPTIONS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'primaryRole', label: 'Primary Role' },
  { value: 'employmentType', label: 'Employment Type' },
  { value: 'payRate', label: 'Pay Rate' },
  { value: 'awardClassification', label: 'Award Classification' },
  { value: 'yearsExperience', label: 'Years Experience' },
  { value: 'maxTravelDistance', label: 'Max Travel Distance (km)' },
  { value: 'preferredLocations', label: 'Preferred Locations' },
  { value: '', label: '— Skip this column —' },
];

// Simple fuzzy match for column headers
function fuzzyMatchField(header: string): string {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  const mappings: Record<string, string> = {
    firstname: 'firstName', first: 'firstName', givenname: 'firstName',
    lastname: 'lastName', last: 'lastName', surname: 'lastName', familyname: 'lastName',
    email: 'email', emailaddress: 'email',
    phone: 'phone', mobile: 'phone', phonenumber: 'phone', contact: 'phone',
    role: 'primaryRole', primaryrole: 'primaryRole', position: 'primaryRole', jobtitle: 'primaryRole',
    employment: 'employmentType', employmenttype: 'employmentType', type: 'employmentType',
    payrate: 'payRate', rate: 'payRate', hourlyrate: 'payRate', pay: 'payRate',
    award: 'awardClassification', classification: 'awardClassification',
    experience: 'yearsExperience', years: 'yearsExperience',
    travel: 'maxTravelDistance', distance: 'maxTravelDistance',
    location: 'preferredLocations', locations: 'preferredLocations',
  };
  return mappings[h] || '';
}

// Existing candidate emails for duplicate detection
const EXISTING_EMAILS = ['sarah@example.com', 'john.doe@email.com', 'jane.smith@agency.com'];
const EXISTING_PHONES = ['0412345678', '0498765432'];

// ─── Component ───────────────────────────────────────────────────────────────
export function CandidateBulkImport({ open, onClose, onImport }: CandidateBulkImportProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [parsedRows, setParsedRows] = useState<CandidateRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isCSV = file.name.endsWith('.csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let headers: string[] = [];
        let data: string[][] = [];

        if (isCSV) {
          const text = event.target?.result as string;
          const lines = text.split('\n').filter(l => l.trim());
          headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          data = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        } else {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
          headers = (json[0] || []).map(String);
          data = json.slice(1).map(row => row.map(String));
        }

        setRawHeaders(headers);
        setRawData(data);

        // Auto-map columns
        const autoMapping: Record<number, string> = {};
        headers.forEach((h, idx) => {
          const match = fuzzyMatchField(h);
          if (match) autoMapping[idx] = match;
        });
        setColumnMapping(autoMapping);
        setStep('mapping');
        toast.success(`Loaded ${data.length} rows from ${file.name}`);
      } catch {
        toast.error('Failed to parse file. Please check the format.');
      }
    };

    if (isCSV) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const handleProceedToPreview = useCallback(() => {
    setIsProcessing(true);

    setTimeout(() => {
      // Build parsed rows
      const rows: CandidateRow[] = rawData.map(row => {
        const mapped: CandidateRow = {
          firstName: '', lastName: '', email: '', phone: '',
          primaryRole: '', employmentType: '', payRate: '',
        };
        Object.entries(columnMapping).forEach(([colIdx, field]) => {
          if (field) mapped[field] = row[Number(colIdx)] || '';
        });
        return mapped;
      }).filter(r => r.firstName || r.lastName || r.email);

      // Validate
      const errors: ValidationResult[] = [];
      rows.forEach((row, idx) => {
        REQUIRED_FIELDS.forEach(field => {
          if (!row[field]?.trim()) {
            errors.push({
              row: idx + 1, field, value: row[field] || '',
              error: `${field} is required`, severity: 'error'
            });
          }
        });
        if (row.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(row.email)) {
          errors.push({
            row: idx + 1, field: 'email', value: row.email,
            error: 'Invalid email format', severity: 'error'
          });
        }
        if (row.phone && !/^[\d\s+()-]{8,15}$/.test(row.phone)) {
          errors.push({
            row: idx + 1, field: 'phone', value: row.phone,
            error: 'Invalid phone format', severity: 'warning'
          });
        }
      });

      // Duplicate detection
      const dupes: DuplicateMatch[] = [];
      rows.forEach((row, idx) => {
        // Check against existing
        if (row.email && EXISTING_EMAILS.includes(row.email.toLowerCase())) {
          dupes.push({ row: idx + 1, matchedWith: row.email, matchField: 'email', confidence: 100 });
        }
        const cleanPhone = row.phone?.replace(/\D/g, '');
        if (cleanPhone && EXISTING_PHONES.includes(cleanPhone)) {
          dupes.push({ row: idx + 1, matchedWith: row.phone, matchField: 'phone', confidence: 95 });
        }
        // Check within file
        rows.forEach((other, otherIdx) => {
          if (otherIdx <= idx) return;
          if (row.email && row.email === other.email) {
            dupes.push({ row: idx + 1, matchedWith: `Row ${otherIdx + 1}`, matchField: 'email', confidence: 100 });
          }
        });
      });

      setParsedRows(rows);
      setValidationErrors(errors);
      setDuplicates(dupes);
      setIsProcessing(false);
      setStep('preview');
    }, 800);
  }, [rawData, columnMapping]);

  const mappedFieldCount = Object.values(columnMapping).filter(Boolean).length;
  const requiredMapped = REQUIRED_FIELDS.filter(f => Object.values(columnMapping).includes(f)).length;

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;
  const dupeRows = new Set(duplicates.map(d => d.row));
  const validRows = parsedRows.filter((_, idx) => {
    if (skipDuplicates && dupeRows.has(idx + 1)) return false;
    return !validationErrors.some(e => e.row === idx + 1 && e.severity === 'error');
  });

  const handleImport = () => {
    onImport?.(validRows);
    toast.success(`${validRows.length} candidates imported successfully!`);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setRawHeaders([]);
    setRawData([]);
    setColumnMapping({});
    setParsedRows([]);
    setValidationErrors([]);
    setDuplicates([]);
  };

  const downloadTemplate = () => {
    const headers = 'First Name,Last Name,Email,Phone,Primary Role,Employment Type,Pay Rate\n';
    const sample = 'Jane,Smith,jane@example.com,0412345678,Registered Nurse,casual,45.00\n';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidate-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return (
    <PrimaryOffCanvas open={open} onClose={onClose} title="Import Candidates" size="4xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'upload', label: '1. Upload' },
          { key: 'mapping', label: '2. Map Columns' },
          { key: 'preview', label: '3. Preview & Import' },
        ].map((s, idx) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              step === s.key
                ? 'bg-primary text-primary-foreground'
                : (idx < ['upload', 'mapping', 'preview'].indexOf(step))
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'
            )}>
              {idx < ['upload', 'mapping', 'preview'].indexOf(step) ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <span>{idx + 1}</span>
              )}
              {s.label}
            </div>
            {idx < 2 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Upload ─────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-4">
          <FormSection title="Upload File" tooltip="Upload a CSV or Excel file with candidate data.">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Drop your file here or click to browse</p>
              <p className="text-xs text-muted-foreground mb-4">Supports CSV, XLS, XLSX — max 10MB</p>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="candidate-file-input"
              />
              <label htmlFor="candidate-file-input">
                <Button variant="outlined" size="small" className="cursor-pointer" onClick={() => document.getElementById('candidate-file-input')?.click()}>
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Choose File
                </Button>
              </label>
            </div>
          </FormSection>

          <FormSection title="Download Template" tooltip="Use our template for fastest import.">
            <Button variant="outlined" size="small" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download CSV Template
            </Button>
          </FormSection>
        </div>
      )}

      {/* ─── Step 2: Column Mapping ─────────────────────────────────────── */}
      {step === 'mapping' && (
        <div className="space-y-4">
          <FormSection
            title={`Column Mapping (${requiredMapped}/${REQUIRED_FIELDS.length} required)`}
          >
            <div className="space-y-2">
              {rawHeaders.map((header, idx) => {
                const mapped = columnMapping[idx] || '';
                const isRequired = mapped && REQUIRED_FIELDS.includes(mapped);
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded border bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{header}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Sample: {rawData[0]?.[idx] || '—'}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Select
                      value={mapped}
                      onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [idx]: v }))}
                    >
                      <SelectTrigger className={cn('w-[200px] h-8 text-xs', isRequired && 'border-emerald-400')}>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isRequired && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </FormSection>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="small" onClick={() => { handleReset(); }}>
              Back
            </Button>
            <Button
              size="small"
              onClick={handleProceedToPreview}
              disabled={requiredMapped < REQUIRED_FIELDS.length || isProcessing}
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
              {isProcessing ? 'Processing...' : 'Preview'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Preview & Import ───────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">{parsedRows.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Rows</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">{validRows.length}</p>
                <p className="text-[10px] text-emerald-600">Ready to Import</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50">
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-700">{errorCount}</p>
                <p className="text-[10px] text-red-600">Errors</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{duplicates.length}</p>
                <p className="text-[10px] text-amber-600">Duplicates</p>
              </div>
            </div>
          </div>

          {/* Duplicates section */}
          {duplicates.length > 0 && (
            <FormSection title={`Duplicate Detection (${duplicates.length} found)`}>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={skipDuplicates}
                  onCheckedChange={(v) => setSkipDuplicates(!!v)}
                  id="skip-dupes"
                />
                <Label htmlFor="skip-dupes" className="text-xs">Skip duplicate rows during import</Label>
              </div>
              <div className="space-y-1">
                {duplicates.map((dupe, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded border border-amber-200 bg-amber-50 text-xs">
                    <span>Row {dupe.row}: matched on <strong>{dupe.matchField}</strong> → {dupe.matchedWith}</span>
                    <Badge variant="secondary" className="text-[10px]">{dupe.confidence}% match</Badge>
                  </div>
                ))}
              </div>
            </FormSection>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <FormSection title={`Validation Issues (${errorCount} errors, ${warningCount} warnings)`}>
              <div className="max-h-[150px] overflow-auto space-y-1">
                {validationErrors.slice(0, 20).map((err, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2 p-1.5 rounded text-xs',
                      err.severity === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
                    )}
                  >
                    {err.severity === 'error' ? <XCircle className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
                    Row {err.row}: {err.error} {err.value && `("${err.value}")`}
                  </div>
                ))}
                {validationErrors.length > 20 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    +{validationErrors.length - 20} more issues
                  </p>
                )}
              </div>
            </FormSection>
          )}

          {/* Data preview table */}
          <FormSection title="Data Preview">
            <div className="overflow-x-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-10">#</TableHead>
                    <TableHead className="text-[10px]">First Name</TableHead>
                    <TableHead className="text-[10px]">Last Name</TableHead>
                    <TableHead className="text-[10px]">Email</TableHead>
                    <TableHead className="text-[10px]">Phone</TableHead>
                    <TableHead className="text-[10px]">Role</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 10).map((row, idx) => {
                    const hasError = validationErrors.some(e => e.row === idx + 1 && e.severity === 'error');
                    const isDupe = dupeRows.has(idx + 1);
                    return (
                      <TableRow key={idx} className={cn(hasError && 'bg-red-50/50', isDupe && 'bg-amber-50/50')}>
                        <TableCell className="text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs">{row.firstName}</TableCell>
                        <TableCell className="text-xs">{row.lastName}</TableCell>
                        <TableCell className="text-xs">{row.email}</TableCell>
                        <TableCell className="text-xs">{row.phone}</TableCell>
                        <TableCell className="text-xs">{row.primaryRole}</TableCell>
                        <TableCell>
                          {hasError ? (
                            <Badge variant="destructive" className="text-[9px] h-4 px-1">Error</Badge>
                          ) : isDupe ? (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-amber-100 text-amber-700">Duplicate</Badge>
                          ) : (
                            <Badge className="text-[9px] h-4 px-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Valid</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="small" onClick={() => setStep('mapping')}>
              Back to Mapping
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {validRows.length} of {parsedRows.length} rows will be imported
              </span>
              <Button
                size="small"
                onClick={handleImport}
                disabled={validRows.length === 0}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Import {validRows.length} Candidates
              </Button>
            </div>
          </div>
        </div>
      )}
    </PrimaryOffCanvas>
  );
}

export default CandidateBulkImport;
