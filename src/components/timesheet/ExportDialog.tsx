import { useState } from 'react';
import { Timesheet } from '@/types/timesheet';
import { validateCompliance } from '@/lib/complianceEngine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  timesheets: Timesheet[];
}

type ExportFormat = 'xlsx' | 'pdf' | 'csv';

interface ExportOptions {
  format: ExportFormat;
  includeDetails: boolean;
  includeBreaks: boolean;
  includeCompliance: boolean;
  includeAllowances: boolean;
}

export function ExportDialog({ open, onClose, timesheets }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeDetails: true,
    includeBreaks: true,
    includeCompliance: true,
    includeAllowances: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (options.format) {
        case 'xlsx':
        case 'csv':
          exportToExcel();
          break;
        case 'pdf':
          exportToPDF();
          break;
      }
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const exportToExcel = () => {
    const data = timesheets.map(ts => {
      const validation = validateCompliance(ts);
      const baseData: Record<string, any> = {
        'Employee Name': ts.employee.name,
        'Employee ID': ts.employee.id,
        'Department': ts.employee.department,
        'Position': ts.employee.position,
        'Location': ts.location.name,
        'Week Start': format(parseISO(ts.weekStartDate), 'MMM d, yyyy'),
        'Week End': format(parseISO(ts.weekEndDate), 'MMM d, yyyy'),
        'Total Hours': ts.totalHours,
        'Regular Hours': ts.regularHours,
        'Overtime Hours': ts.overtimeHours,
        'Status': ts.status.toUpperCase(),
        'Submitted': format(parseISO(ts.submittedAt), 'MMM d, yyyy h:mm a'),
      };

      if (options.includeBreaks) {
        baseData['Total Break Minutes'] = ts.totalBreakMinutes;
      }

      if (options.includeCompliance) {
        baseData['Compliant'] = validation.isCompliant ? 'Yes' : 'No';
        baseData['Flags'] = validation.flags.length;
        baseData['Flag Details'] = validation.flags.map(f => f.description).join('; ');
      }

      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheets');

    // Add detail sheet if requested
    if (options.includeDetails) {
      const detailData: Record<string, any>[] = [];
      timesheets.forEach(ts => {
        ts.entries.forEach(entry => {
          detailData.push({
            'Employee Name': ts.employee.name,
            'Date': format(parseISO(entry.date), 'MMM d, yyyy'),
            'Clock In': entry.clockIn,
            'Clock Out': entry.clockOut || 'N/A',
            'Gross Hours': entry.grossHours,
            'Net Hours': entry.netHours,
            'Break Minutes': entry.totalBreakMinutes,
            'Overtime': entry.overtime,
            'Notes': entry.notes || '',
          });
        });
      });
      const detailWs = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWs, 'Daily Details');
    }

    const fileName = `timesheets_${format(new Date(), 'yyyy-MM-dd')}.${options.format}`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Timesheet Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalHours = timesheets.reduce((sum, t) => sum + t.totalHours, 0);
    const totalOvertime = timesheets.reduce((sum, t) => sum + t.overtimeHours, 0);
    const pendingCount = timesheets.filter(t => t.status === 'pending').length;
    const approvedCount = timesheets.filter(t => t.status === 'approved').length;

    doc.text(`Total Timesheets: ${timesheets.length}`, 14, 55);
    doc.text(`Total Hours: ${totalHours}h`, 14, 62);
    doc.text(`Total Overtime: ${totalOvertime}h`, 14, 69);
    doc.text(`Pending: ${pendingCount} | Approved: ${approvedCount}`, 14, 76);

    // Table
    let yPos = 95;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Timesheet Details', 14, yPos);
    yPos += 10;

    // Table headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const headers = ['Employee', 'Department', 'Week', 'Hours', 'OT', 'Status'];
    const colWidths = [45, 35, 40, 20, 15, 25];
    let xPos = 14;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 6;

    // Table rows
    doc.setFont('helvetica', 'normal');
    timesheets.forEach(ts => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      xPos = 14;
      const rowData = [
        ts.employee.name.substring(0, 20),
        ts.employee.department.substring(0, 15),
        `${format(parseISO(ts.weekStartDate), 'MMM d')} - ${format(parseISO(ts.weekEndDate), 'MMM d')}`,
        `${ts.totalHours}h`,
        `${ts.overtimeHours}h`,
        ts.status.toUpperCase(),
      ];

      rowData.forEach((cell, i) => {
        doc.text(cell, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 6;
    });

    const fileName = `timesheets_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Timesheets
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(v) => setOptions({ ...options, format: v as ExportFormat })}
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="xlsx" id="xlsx" className="peer sr-only" />
                <Label
                  htmlFor="xlsx"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="h-6 w-6 mb-2 text-emerald-600" />
                  <span className="text-sm font-medium">Excel</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                <Label
                  htmlFor="csv"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">CSV</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="h-6 w-6 mb-2 text-red-600" />
                  <span className="text-sm font-medium">PDF</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in Export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="details"
                  checked={options.includeDetails}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeDetails: checked as boolean })
                  }
                />
                <Label htmlFor="details" className="text-sm flex items-center gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Daily entry details
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="breaks"
                  checked={options.includeBreaks}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeBreaks: checked as boolean })
                  }
                />
                <Label htmlFor="breaks" className="text-sm flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Break information
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="compliance"
                  checked={options.includeCompliance}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeCompliance: checked as boolean })
                  }
                />
                <Label htmlFor="compliance" className="text-sm flex items-center gap-2 cursor-pointer">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Compliance flags
                </Label>
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{timesheets.length}</span>
              <span className="text-muted-foreground">timesheets will be exported</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
