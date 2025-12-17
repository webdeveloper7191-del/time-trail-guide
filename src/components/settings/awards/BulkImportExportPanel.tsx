import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, Download, FileSpreadsheet, FileJson, FileText, 
  CheckCircle2, AlertCircle, ArrowRight, RefreshCw,
  Folder, Clock, FileCheck, AlertTriangle
} from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface ImportResult {
  success: number;
  failed: number;
  warnings: number;
  errors: string[];
}

export function BulkImportExportPanel() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exportOptions, setExportOptions] = useState({
    includeOverrides: true,
    includeHistory: true,
    includeCustomRules: true,
    format: 'xlsx' as 'xlsx' | 'csv' | 'json',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: 'xlsx' | 'csv' | 'json') => {
    setIsExporting(true);
    setExportOptions(prev => ({ ...prev, format }));
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsExporting(false);
    toast.success(`Awards configuration exported as ${format.toUpperCase()}`, {
      description: `${australianAwards.length} awards with all configurations`,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowImportDialog(true);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate import progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setImportProgress(i);
    }
    
    setImportResult({
      success: 45,
      failed: 2,
      warnings: 3,
      errors: [
        'Row 23: Invalid classification ID "cs-invalid"',
        'Row 47: Rate value cannot be negative',
      ],
    });
    
    setIsImporting(false);
    toast.success('Import completed', {
      description: '45 records imported successfully',
    });
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setImportProgress(0);
    setShowImportDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bulk Import & Export</h3>
          <p className="text-sm text-muted-foreground">
            Import or export award configurations in bulk
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card className="card-material-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Export Configuration</CardTitle>
                <CardDescription>Download award settings and overrides</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Include in Export</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeOverrides" 
                    checked={exportOptions.includeOverrides}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeOverrides: !!checked }))}
                  />
                  <Label htmlFor="includeOverrides" className="text-sm">Custom Rate Overrides</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeHistory" 
                    checked={exportOptions.includeHistory}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeHistory: !!checked }))}
                  />
                  <Label htmlFor="includeHistory" className="text-sm">Rate Change History</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeCustomRules" 
                    checked={exportOptions.includeCustomRules}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeCustomRules: !!checked }))}
                  />
                  <Label htmlFor="includeCustomRules" className="text-sm">Custom Rules & Conditions</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Format</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleExport('xlsx')}
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                  <span className="text-xs font-medium">Excel (.xlsx)</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-medium">CSV (.csv)</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                >
                  <FileJson className="h-6 w-6 text-amber-600" />
                  <span className="text-xs font-medium">JSON (.json)</span>
                </Button>
              </div>
            </div>

            {isExporting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Preparing export...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card className="card-material-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Import Configuration</CardTitle>
                <CardDescription>Upload award settings from file</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Drop files here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .xlsx, .csv, and .json files
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Import Guidelines</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Use the exported template for correct format
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Award IDs must match existing awards
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  Existing overrides will be updated
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
          </DialogHeader>
          
          {!importResult ? (
            <div className="space-y-4 py-4">
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Badge variant="secondary">Ready</Badge>
                </div>
              )}

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={resetImport} disabled={isImporting}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10">
                  <p className="text-2xl font-bold text-amber-600">{importResult.warnings}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Errors
                  </p>
                  <ScrollArea className="h-24 border rounded-lg p-2">
                    {importResult.errors.map((error, i) => (
                      <p key={i} className="text-xs text-red-600">{error}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <DialogFooter>
                <Button onClick={resetImport}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent Activity */}
      <Card className="card-material">
        <CardHeader>
          <CardTitle className="text-base">Recent Import/Export Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'Export', format: 'XLSX', date: '2024-03-15 14:30', records: 156, status: 'success' },
              { action: 'Import', format: 'CSV', date: '2024-03-10 09:15', records: 45, status: 'success' },
              { action: 'Export', format: 'JSON', date: '2024-02-28 16:45', records: 156, status: 'success' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {activity.action === 'Export' ? (
                    <Download className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Upload className="h-5 w-5 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium">{activity.action} ({activity.format})</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{activity.records} records</Badge>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
