import { ReactNode, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Download, FileText, FileSpreadsheet, CalendarIcon, X, GitCompareArrows } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExportColumn, exportToCSV, exportToPDF } from '@/lib/reportExport';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  // Period comparison
  comparisonEnabled?: boolean;
  onComparisonToggle?: () => void;
  comparisonRange?: DateRange;
  onComparisonRangeChange?: (range: DateRange | undefined) => void;
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
  comparisonEnabled,
  onComparisonToggle,
  comparisonRange,
  onComparisonRangeChange,
}: ReportFilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [compCalOpen, setCompCalOpen] = useState(false);

  return (
    <div className="space-y-2">
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
                className={cn("p-3 pointer-events-auto")}
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

        {/* Period comparison toggle */}
        {onComparisonToggle && (
          <Button
            variant={comparisonEnabled ? 'default' : 'outline'}
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={onComparisonToggle}
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            {comparisonEnabled ? 'Comparing' : 'Compare'}
          </Button>
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

      {/* Comparison date range picker */}
      {comparisonEnabled && onComparisonRangeChange && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-200">
          <GitCompareArrows className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">Compare with:</span>
          <Popover open={compCalOpen} onOpenChange={setCompCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('h-7 gap-1.5 text-xs font-normal', comparisonRange?.from && 'text-foreground')}>
                <CalendarIcon className="h-3 w-3" />
                {comparisonRange?.from ? (
                  comparisonRange.to
                    ? `${format(comparisonRange.from, 'dd MMM')} – ${format(comparisonRange.to, 'dd MMM')}`
                    : format(comparisonRange.from, 'dd MMM yyyy')
                ) : 'Select previous period'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={comparisonRange}
                onSelect={(r) => {
                  onComparisonRangeChange(r);
                  if (r?.to) setCompCalOpen(false);
                }}
                numberOfMonths={2}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
              {comparisonRange?.from && (
                <div className="border-t border-border/60 p-2 flex justify-end">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { onComparisonRangeChange(undefined); setCompCalOpen(false); }}>
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          {comparisonRange?.from && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              vs {format(comparisonRange.from, 'dd MMM')}
              {comparisonRange.to && ` – ${format(comparisonRange.to, 'dd MMM')}`}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">Select a previous date range to see delta metrics</span>
        </div>
      )}
    </div>
  );
}
