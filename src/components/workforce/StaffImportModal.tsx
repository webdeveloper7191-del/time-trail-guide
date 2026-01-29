import { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Upload, FileSpreadsheet, FileText, Wand2, 
  Check, AlertTriangle, X, RefreshCw, ArrowRight,
  ChevronLeft, ChevronRight, Download, Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StaffColumnMapper } from './StaffColumnMapper';
import { 
  staffETL, 
  ColumnMappingConfig, 
  StaffImportResult,
  ImportedStaffRecord 
} from '@/lib/etl/staffETL';
import { cn } from '@/lib/utils';

interface StaffImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: StaffImportResult) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'result';

export function StaffImportModal({ open, onOpenChange, onImportComplete }: StaffImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMappingConfig[]>([]);
  const [importResult, setImportResult] = useState<StaffImportResult | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setRawData([]);
    setHeaders([]);
    setMappings([]);
    setImportResult(null);
    setPreviewPage(0);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const parseFile = async (file: File): Promise<{ headers: string[]; data: Record<string, any>[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          
          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const text = data as string;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              const record: Record<string, any> = {};
              headers.forEach((header, i) => {
                record[header] = values[i] || '';
              });
              return record;
            });
            resolve({ headers, data: rows });
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length === 0) {
              reject(new Error('Empty file'));
              return;
            }
            
            const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
            const rows = jsonData.slice(1).map(row => {
              const record: Record<string, any> = {};
              headers.forEach((header, i) => {
                record[header] = row[i] !== undefined ? row[i] : '';
              });
              return record;
            }).filter(row => Object.values(row).some(v => v !== ''));
            
            resolve({ headers, data: rows });
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const isValid = validTypes.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      toast.error('Invalid file type. Please upload CSV or Excel file.');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const { headers: fileHeaders, data } = await parseFile(file);
      setHeaders(fileHeaders);
      setRawData(data);
      
      // Auto-detect mappings
      const detectedMappings = staffETL.autoDetectMappings(fileHeaders);
      setMappings(detectedMappings);
      
      toast.success(`Parsed ${data.length} records`, {
        description: `${detectedMappings.length} columns auto-mapped`,
      });
      
      setStep('mapping');
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDropFile = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: { files: dt.files } } as any);
      }
    }
  };

  const handlePreview = () => {
    setIsProcessing(true);
    
    // Apply mappings and transform
    staffETL.setMappings(mappings);
    const result = staffETL.transform(rawData);
    setImportResult(result);
    
    setIsProcessing(false);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!importResult) return;
    
    setIsProcessing(true);
    
    // Simulate import delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Import completed', {
      description: `${importResult.success} records imported successfully`,
    });
    
    onImportComplete?.(importResult);
    setStep('result');
    setIsProcessing(false);
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'First Name', 'Last Name', 'Email', 'Mobile Phone', 'Employee ID',
      'Position', 'Department', 'Start Date', 'Employment Type', 'Status',
      'Hourly Rate', 'Address', 'Suburb', 'State', 'Postcode'
    ];
    
    const sampleRow = [
      'John', 'Smith', 'john.smith@example.com', '0412345678', 'EMP001',
      'Educator', 'Operations', '01/01/2024', 'Full Time', 'Active',
      '32.50', '123 Main St', 'Melbourne', 'VIC', '3000'
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Import Template');
    XLSX.writeFile(wb, 'staff_import_template.xlsx');
    
    toast.success('Template downloaded');
  };

  const previewRecords = importResult?.records.slice(previewPage * 5, (previewPage + 1) * 5) || [];
  const totalPreviewPages = Math.ceil((importResult?.records.length || 0) / 5);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Import Staff</SheetTitle>
          <SheetDescription>
            Upload a CSV or Excel file to import staff profiles
          </SheetDescription>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-4 border-b">
          {(['upload', 'mapping', 'preview', 'result'] as ImportStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div 
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s 
                    ? "bg-primary text-primary-foreground" 
                    : ['mapping', 'preview', 'result'].indexOf(step) > ['upload', 'mapping', 'preview', 'result'].indexOf(s)
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {['mapping', 'preview', 'result'].indexOf(step) > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  ['mapping', 'preview', 'result'].indexOf(step) > i ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          ))}
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground capitalize">{step}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden py-4">
          {step === 'upload' && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDropFile}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isProcessing ? (
                  <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                ) : (
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                )}
                <p className="text-sm font-medium">
                  {isProcessing ? 'Processing...' : 'Drop files here or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">Import Guidelines</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      First row should contain column headers
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Required: First Name, Last Name, Email, Employee ID
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Dates can be in DD/MM/YYYY or YYYY-MM-DD format
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      Maximum 500 records per import
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'mapping' && (
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rawData.length} records • {headers.length} columns
                      </p>
                    </div>
                    <Badge variant="secondary">{mappings.length} mapped</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {mappings.length} columns auto-detected. Review and adjust mappings below.
                  </span>
                </div>

                <StaffColumnMapper
                  sourceColumns={headers}
                  mappings={mappings}
                  onMappingsChange={setMappings}
                  sampleData={rawData.slice(0, 3)}
                />
              </div>
            </ScrollArea>
          )}

          {step === 'preview' && importResult && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                    <p className="text-xs text-muted-foreground">Ready</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{importResult.warnings}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Records */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {previewRecords.map((record) => (
                    <Card 
                      key={record.index}
                      className={cn(
                        "border-l-4",
                        record.status === 'success' && "border-l-green-500",
                        record.status === 'warning' && "border-l-amber-500",
                        record.status === 'error' && "border-l-red-500"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {record.status === 'success' && <Check className="h-4 w-4 text-green-500" />}
                              {record.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                              {record.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                              <span className="font-medium text-sm">
                                {record.data.firstName} {record.data.lastName}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {record.data.email} • {record.data.position || 'No position'}
                            </p>
                            {record.messages.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {record.messages.map((msg, i) => (
                                  <p key={i} className="text-xs text-amber-600">{msg}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Row {record.index + 2}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {totalPreviewPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                    disabled={previewPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {previewPage + 1} of {totalPreviewPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage(p => Math.min(totalPreviewPages - 1, p + 1))}
                    disabled={previewPage >= totalPreviewPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6 text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Import Complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Successfully imported {importResult.success} staff records
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{importResult.warnings}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Card className="text-left">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Errors</p>
                    <ScrollArea className="h-24">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <p key={i} className="text-xs text-red-600 mb-1">
                          Row {error.recordIndex + 2}: {error.message}
                        </p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          + {importResult.errors.length - 5} more errors
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="border-t pt-4 flex-row gap-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          )}
          
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handlePreview} 
                disabled={mappings.length === 0 || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Preview
              </Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isProcessing || importResult?.success === 0}
                className="flex-1"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import {importResult?.success || 0} Records
              </Button>
            </>
          )}
          
          {step === 'result' && (
            <Button onClick={handleClose} className="flex-1">
              Done
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
