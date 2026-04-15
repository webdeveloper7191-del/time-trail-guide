import { ReactNode, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Download, FileText, FileSpreadsheet, CalendarIcon, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExportColumn, exportToCSV, exportToPDF } from '@/lib/reportExport';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface ReportFilterBarProps {
  title: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  locationFilter?: string;
  onLocationChange?: (v: string) => void;
  locations?: string[];
  children?: ReactNode;
  exportColumns?: ExportColumn[];
  exportData?: any[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  showDateFilter?: boolean;
}

export function ReportFilterBar({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  locationFilter,
  onLocationChange,
  locations = [],
  children,
  exportColumns,
  exportData,
  dateRange,
  onDateRangeChange,
  showDateFilter = true,
}: ReportFilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>
      {locations.length > 0 && onLocationChange && (
        <Select value={locationFilter || 'all'} onValueChange={onLocationChange}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showDateFilter && onDateRangeChange && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('h-9 gap-2 text-sm font-normal', dateRange?.from && 'text-foreground')}>
              <CalendarIcon className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, 'dd MMM')} – ${format(dateRange.to, 'dd MMM yyyy')}`
                ) : format(dateRange.from, 'dd MMM yyyy')
              ) : 'Date range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                onDateRangeChange(range);
                if (range?.to) setCalendarOpen(false);
              }}
              numberOfMonths={2}
              initialFocus
            />
            {dateRange?.from && (
              <div className="border-t border-border/60 p-2 flex justify-end">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { onDateRangeChange(undefined); setCalendarOpen(false); }}>
                  <X className="h-3 w-3 mr-1" /> Clear dates
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
      {children}
      {exportColumns && exportData && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9 ml-auto">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportToPDF(title, exportColumns, exportData)}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToCSV(title, exportColumns, exportData)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
