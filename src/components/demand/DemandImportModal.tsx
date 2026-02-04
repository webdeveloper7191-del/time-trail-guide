import { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Upload, FileSpreadsheet, Wand2, 
  Check, AlertTriangle, X, RefreshCw, 
  ChevronLeft, ChevronRight, Download,
  Calendar, Clock, Users, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DemandColumnMapper } from './DemandColumnMapper';
import { 
  demandCSVImport, 
  ColumnMappingConfig, 
  DemandImportResult,
  DemandImportType,
} from '@/lib/etl/demandCSVImport';
import { CSV_TEMPLATES } from '@/types/demandIntegration';
import { cn } from '@/lib/utils';

interface DemandImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: DemandImportResult) => void;
  defaultImportType?: DemandImportType;
}

type ImportStep = 'type' | 'upload' | 'mapping' | 'preview' | 'result';

const IMPORT_TYPE_OPTIONS: { value: DemandImportType; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'bookings', 
    label: 'Child Bookings', 
    description: 'Individual booking records with child details',
    icon: <Calendar className="h-5 w-5" />
  },
  { 
    value: 'bookingSummary', 
    label: 'Booking Summary', 
    description: 'Aggregated booking counts by time slot',
    icon: <Users className="h-5 w-5" />
  },
  { 
    value: 'historicalAttendance', 
    label: 'Historical Attendance', 
    description: 'Past attendance records for forecasting',
    icon: <Clock className="h-5 w-5" />
  },
  { 
    value: 'todayAttendance', 
    label: "Today's Attendance", 
    description: 'Real-time sign-in/sign-out events',
    icon: <Users className="h-5 w-5" />
  },
  { 
    value: 'rooms', 
    label: 'Room Configuration', 
    description: 'Room capacity and age group settings',
    icon: <MapPin className="h-5 w-5" />
  },
];

export function DemandImportModal({ 
  open, 
  onOpenChange, 
  onImportComplete,
  defaultImportType 
}: DemandImportModalProps) {
  const [step, setStep] = useState<ImportStep>(defaultImportType ? 'upload' : 'type');
  const [importType, setImportType] = useState<DemandImportType>(defaultImportType || 'bookings');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMappingConfig[]>([]);
  const [importResult, setImportResult] = useState<DemandImportResult | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep(defaultImportType ? 'upload' : 'type');
    setImportType(defaultImportType || 'bookings');
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
  }, [defaultImportType]);

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
      demandCSVImport.setImportType(importType);
      const detectedMappings = demandCSVImport.autoDetectMappings(fileHeaders);
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
    demandCSVImport.setImportType(importType);
    demandCSVImport.setMappings(mappings);
    const result = demandCSVImport.transform(rawData);
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
    const templateKey = importType as keyof typeof CSV_TEMPLATES;
    const template = CSV_TEMPLATES[templateKey];
    
    if (!template) {
      toast.error('Template not available for this import type');
      return;
    }
    
    const ws = XLSX.utils.aoa_to_sheet([template.headers, template.example.split(',')]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${importType}_template`);
    XLSX.writeFile(wb, `demand_${importType}_template.xlsx`);
    
    toast.success('Template downloaded');
  };

  const getSteps = (): ImportStep[] => {
    return defaultImportType 
      ? ['upload', 'mapping', 'preview', 'result']
      : ['type', 'upload', 'mapping', 'preview', 'result'];
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);

  const previewRecords = importResult?.records.slice(previewPage * 5, (previewPage + 1) * 5) || [];
  const totalPreviewPages = Math.ceil((importResult?.records.length || 0) / 5);

  const selectedTypeOption = IMPORT_TYPE_OPTIONS.find(o => o.value === importType);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Import Demand Data</SheetTitle>
          <SheetDescription>
            {selectedTypeOption 
              ? `Import ${selectedTypeOption.label} - ${selectedTypeOption.description}`
              : 'Upload CSV or Excel files to import demand data'
            }
          </SheetDescription>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-4 border-b">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div 
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s 
                    ? "bg-primary text-primary-foreground" 
                    : currentStepIndex > i
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {currentStepIndex > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  currentStepIndex > i ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          ))}
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground capitalize">{step}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden py-4">
          {/* Step 1: Select Import Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the type of demand data you want to import:
              </p>
              <RadioGroup 
                value={importType} 
                onValueChange={(v) => setImportType(v as DemandImportType)}
                className="grid grid-cols-1 gap-3"
              >
                {IMPORT_TYPE_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={cn(
                      "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
                      importType === option.value 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className={cn(
                      "p-2 rounded-lg",
                      importType === option.value ? "bg-primary/10 text-primary" : "bg-muted"
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Upload File */}
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
                Download {selectedTypeOption?.label} Template
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
                      Dates can be in DD/MM/YYYY or YYYY-MM-DD format
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Times should be in HH:mm format (e.g., 07:30)
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      Maximum 1000 records per import
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Column Mapping */}
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

                <DemandColumnMapper
                  importType={importType}
                  sourceColumns={headers}
                  mappings={mappings}
                  onMappingsChange={setMappings}
                  sampleData={rawData.slice(0, 3)}
                />
              </div>
            </ScrollArea>
          )}

          {/* Step 4: Preview */}
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
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {record.status === 'success' && <Check className="h-4 w-4 text-green-500" />}
                              {record.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                              {record.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                              <span className="font-medium text-sm">
                                {record.data.date && `${record.data.date} • `}
                                {record.data.roomId || record.data.childId || `Row ${record.index + 1}`}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {Object.entries(record.data)
                                .filter(([k, v]) => v && k !== 'date' && k !== 'roomId' && k !== 'childId')
                                .slice(0, 3)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' • ')}
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

          {/* Step 5: Result */}
          {step === 'result' && importResult && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Import Complete</h3>
                <p className="text-muted-foreground mt-1">
                  Successfully imported {importResult.success} {selectedTypeOption?.label.toLowerCase()} records
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <Card className="bg-green-500/10">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{importResult.success}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-amber-600">{importResult.warnings}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={() => {
                if (step === 'type' || (step === 'upload' && defaultImportType)) {
                  handleClose();
                } else {
                  const prevStep = steps[currentStepIndex - 1];
                  if (prevStep) setStep(prevStep);
                }
              }}
            >
              {step === 'type' || (step === 'upload' && defaultImportType) ? 'Cancel' : 'Back'}
            </Button>
            
            <div className="flex gap-2">
              {step === 'type' && (
                <Button onClick={() => setStep('upload')}>
                  Continue
                </Button>
              )}
              
              {step === 'mapping' && (
                <Button 
                  onClick={handlePreview}
                  disabled={mappings.length === 0 || isProcessing}
                >
                  Preview Import
                </Button>
              )}
              
              {step === 'preview' && (
                <Button 
                  onClick={handleImport}
                  disabled={!importResult || importResult.success === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Import ${importResult?.success || 0} Records`
                  )}
                </Button>
              )}
              
              {step === 'result' && (
                <Button onClick={handleClose}>
                  Done
                </Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
