import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import {
  Upload, FileText, Download, AlertTriangle, CheckCircle2,
  XCircle, Users, Loader2, ArrowRight, ChevronRight, Eye
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

const EXISTING_EMAILS = ['sarah@example.com', 'john.doe@email.com', 'jane.smith@agency.com'];
const EXISTING_PHONES = ['0412345678', '0498765432'];

// ─── Summary KPI Card ───────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, value, label, iconColor, bgColor }: {
  icon: typeof Users;
  value: number;
  label: string;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className="bg-background border border-border rounded-xl p-4 flex items-start justify-between">
      <div>
        <p className="text-[13px] text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold tracking-tight mt-1">{value}</p>
      </div>
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', bgColor)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
    </div>
  );
}

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
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
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

      const dupes: DuplicateMatch[] = [];
      rows.forEach((row, idx) => {
        if (row.email && EXISTING_EMAILS.includes(row.email.toLowerCase())) {
          dupes.push({ row: idx + 1, matchedWith: row.email, matchField: 'email', confidence: 100 });
        }
        const cleanPhone = row.phone?.replace(/\D/g, '');
        if (cleanPhone && EXISTING_PHONES.includes(cleanPhone)) {
          dupes.push({ row: idx + 1, matchedWith: row.phone, matchField: 'phone', confidence: 95 });
        }
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
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Import Candidates"
      description="Upload and map candidate data from CSV or Excel files"
      icon={Upload}
      size="4xl"
      isBackground
      actions={step === 'preview' ? [
        { label: 'Back to Mapping', variant: 'outlined' as const, onClick: () => setStep('mapping') },
        { label: `Import ${validRows.length} Candidates`, variant: 'primary' as const, onClick: handleImport, disabled: validRows.length === 0, icon: <Upload className="h-4 w-4" /> },
      ] : step === 'mapping' ? [
        { label: 'Back', variant: 'outlined' as const, onClick: handleReset },
        { label: isProcessing ? 'Processing...' : 'Preview', variant: 'primary' as const, onClick: handleProceedToPreview, disabled: requiredMapped < REQUIRED_FIELDS.length || isProcessing, icon: isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" /> },
      ] : []}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[
          { key: 'upload', label: '1. Upload' },
          { key: 'mapping', label: '2. Map Columns' },
          { key: 'preview', label: '3. Preview & Import' },
        ].map((s, idx) => (
          <div key={s.key} className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              step === s.key
                ? 'bg-primary text-primary-foreground'
                : (idx < ['upload', 'mapping', 'preview'].indexOf(step))
                  ? 'bg-status-approved-bg text-status-approved'
                  : 'bg-muted text-muted-foreground'
            )}>
              {idx < ['upload', 'mapping', 'preview'].indexOf(step) ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span>{idx + 1}</span>
              )}
              {s.label}
            </div>
            {idx < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Upload ─────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-5">
          <FormSection title="Upload File" tooltip="Upload a CSV or Excel file with candidate data.">
            <div className="border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Drop your file here or click to browse</p>
              <p className="text-[13px] text-muted-foreground mb-5">Supports CSV, XLS, XLSX — max 10MB</p>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="candidate-file-input"
              />
              <Button variant="outlined" size="medium" onClick={() => document.getElementById('candidate-file-input')?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </FormSection>

          <FormSection title="Download Template" tooltip="Use our template for fastest import.">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">Download a pre-formatted CSV template with all supported columns.</p>
              <Button variant="outlined" size="medium" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </div>
          </FormSection>
        </div>
      )}

      {/* ─── Step 2: Column Mapping ─────────────────────────────────────── */}
      {step === 'mapping' && (
        <div className="space-y-5">
          <FormSection title={`Column Mapping — ${requiredMapped}/${REQUIRED_FIELDS.length} required fields mapped`}>
            {fileName && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                <span className="text-[13px] text-muted-foreground ml-auto">{rawData.length} rows detected</span>
              </div>
            )}
            <div className="space-y-2">
              {rawHeaders.map((header, idx) => {
                const mapped = columnMapping[idx] || '';
                const isRequired = mapped && REQUIRED_FIELDS.includes(mapped);
                return (
                  <div key={idx} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{header}</p>
                      <p className="text-[13px] text-muted-foreground truncate">
                        Sample: {rawData[0]?.[idx] || '—'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select
                      value={mapped}
                      onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [idx]: v }))}
                    >
                      <SelectTrigger className={cn('w-[220px] h-9 text-sm', isRequired && 'border-status-approved')}>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isRequired && <CheckCircle2 className="h-4 w-4 text-status-approved shrink-0" />}
                  </div>
                );
              })}
            </div>
          </FormSection>
        </div>
      )}

      {/* ─── Step 3: Preview & Import ───────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <SummaryCard icon={Users} value={parsedRows.length} label="Total Rows" iconColor="text-primary" bgColor="bg-primary/10" />
            <SummaryCard icon={CheckCircle2} value={validRows.length} label="Ready to Import" iconColor="text-status-approved" bgColor="bg-status-approved-bg" />
            <SummaryCard icon={XCircle} value={errorCount} label="Errors" iconColor="text-status-rejected" bgColor="bg-status-rejected-bg" />
            <SummaryCard icon={AlertTriangle} value={duplicates.length} label="Duplicates" iconColor="text-status-pending" bgColor="bg-status-pending-bg" />
          </div>

          {/* Duplicates section */}
          {duplicates.length > 0 && (
            <FormSection title={`Duplicate Detection (${duplicates.length} found)`}>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={skipDuplicates}
                  onCheckedChange={(v) => setSkipDuplicates(!!v)}
                  id="skip-dupes"
                />
                <Label htmlFor="skip-dupes" className="text-sm">Skip duplicate rows during import</Label>
              </div>
              <div className="space-y-1.5">
                {duplicates.map((dupe, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-status-pending/30 bg-status-pending-bg text-sm">
                    <span>Row {dupe.row}: matched on <strong>{dupe.matchField}</strong> → {dupe.matchedWith}</span>
                    <Badge variant="secondary" className="text-xs">{dupe.confidence}% match</Badge>
                  </div>
                ))}
              </div>
            </FormSection>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <FormSection title={`Validation Issues (${errorCount} errors, ${warningCount} warnings)`}>
              <div className="max-h-[200px] overflow-auto space-y-1.5">
                {validationErrors.slice(0, 20).map((err, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm',
                      err.severity === 'error' ? 'bg-status-rejected-bg text-status-rejected' : 'bg-status-pending-bg text-status-pending'
                    )}
                  >
                    {err.severity === 'error' ? <XCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    Row {err.row}: {err.error} {err.value && `("${err.value}")`}
                  </div>
                ))}
                {validationErrors.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{validationErrors.length - 20} more issues
                  </p>
                )}
              </div>
            </FormSection>
          )}

          {/* Data preview table */}
          <FormSection title="Data Preview">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] text-muted-foreground">
                Showing first {Math.min(parsedRows.length, 10)} of {parsedRows.length} rows
              </p>
              <span className="text-sm font-medium text-primary">
                {validRows.length} of {parsedRows.length} rows will be imported
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold w-12">#</TableHead>
                    <TableHead className="text-xs font-semibold">First Name</TableHead>
                    <TableHead className="text-xs font-semibold">Last Name</TableHead>
                    <TableHead className="text-xs font-semibold">Email</TableHead>
                    <TableHead className="text-xs font-semibold">Phone</TableHead>
                    <TableHead className="text-xs font-semibold">Role</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 10).map((row, idx) => {
                    const hasError = validationErrors.some(e => e.row === idx + 1 && e.severity === 'error');
                    const isDupe = dupeRows.has(idx + 1);
                    return (
                      <TableRow key={idx} className={cn(hasError && 'bg-status-rejected-bg/30', isDupe && 'bg-status-pending-bg/30')}>
                        <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-sm">{row.firstName}</TableCell>
                        <TableCell className="text-sm">{row.lastName}</TableCell>
                        <TableCell className="text-sm">{row.email}</TableCell>
                        <TableCell className="text-sm">{row.phone}</TableCell>
                        <TableCell className="text-sm">{row.primaryRole}</TableCell>
                        <TableCell>
                          {hasError ? (
                            <Badge className="text-xs bg-status-rejected-bg text-status-rejected border-0 hover:bg-status-rejected-bg">Error</Badge>
                          ) : isDupe ? (
                            <Badge className="text-xs bg-status-pending-bg text-status-pending border-0 hover:bg-status-pending-bg">Duplicate</Badge>
                          ) : (
                            <Badge className="text-xs bg-status-approved-bg text-status-approved border-0 hover:bg-status-approved-bg">Valid</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </FormSection>
        </div>
      )}
    </PrimaryOffCanvas>
  );
}

export default CandidateBulkImport;
