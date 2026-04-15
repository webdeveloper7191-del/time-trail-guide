import { useState, useMemo, useCallback, ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp, ArrowDown, ArrowUpDown, Filter, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | ReactNode;
  /** Raw sortable/filterable value — if not set, accessor is used */
  sortValue?: (row: T) => string | number;
  /** Alignment */
  align?: 'left' | 'right' | 'center';
  /** Fixed width class */
  className?: string;
  /** Disable column filtering */
  filterable?: boolean;
}

interface ReportDataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
}

type SortDir = 'asc' | 'desc' | null;

export function ReportDataTable<T>({ columns, data, rowKey, emptyMessage = 'No data found' }: ReportDataTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({});

  const getRawValue = useCallback((col: DataTableColumn<T>, row: T): string => {
    if (col.sortValue) return String(col.sortValue(row));
    const v = col.accessor(row);
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    return '';
  }, []);

  const getNumericValue = useCallback((col: DataTableColumn<T>, row: T): number | null => {
    if (col.sortValue) {
      const v = col.sortValue(row);
      return typeof v === 'number' ? v : parseFloat(String(v));
    }
    const v = col.accessor(row);
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
      return isNaN(n) ? null : n;
    }
    return null;
  }, []);

  // Compute distinct values per column
  const distinctValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    columns.forEach(col => {
      if (col.filterable === false) return;
      const vals = new Set<string>();
      data.forEach(row => vals.add(getRawValue(col, row)));
      map[col.key] = Array.from(vals).sort();
    });
    return map;
  }, [columns, data, getRawValue]);

  // Apply column filters
  const filteredData = useMemo(() => {
    return data.filter(row => {
      for (const col of columns) {
        const filterSet = columnFilters[col.key];
        if (filterSet && filterSet.size > 0) {
          const raw = getRawValue(col, row);
          if (!filterSet.has(raw)) return false;
        }
        const searchTerm = columnSearches[col.key];
        if (searchTerm) {
          const raw = getRawValue(col, row).toLowerCase();
          if (!raw.includes(searchTerm.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [data, columns, columnFilters, columnSearches, getRawValue]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortCol || !sortDir) return filteredData;
    const col = columns.find(c => c.key === sortCol);
    if (!col) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aNum = getNumericValue(col, a);
      const bNum = getNumericValue(col, b);
      if (aNum !== null && bNum !== null && !isNaN(aNum) && !isNaN(bNum)) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      const aStr = getRawValue(col, a);
      const bStr = getRawValue(col, b);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortCol, sortDir, columns, getRawValue, getNumericValue]);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortCol(null); setSortDir(null); }
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  const toggleDistinctValue = (colKey: string, value: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[colKey] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size === 0) delete next[colKey];
      else next[colKey] = set;
      return next;
    });
  };

  const clearColumnFilter = (colKey: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
    setColumnSearches(prev => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  };

  const hasActiveFilter = (colKey: string) => {
    return (columnFilters[colKey] && columnFilters[colKey].size > 0) || !!columnSearches[colKey];
  };

  const activeFilterCount = Object.keys(columnFilters).length + Object.keys(columnSearches).filter(k => columnSearches[k]).length;

  return (
    <div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/60 text-xs">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{activeFilterCount} column filter{activeFilterCount > 1 ? 's' : ''} active</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{sortedData.length} of {data.length} rows</span>
          <Button variant="ghost" size="sm" className="h-5 text-xs px-2 ml-auto" onClick={() => { setColumnFilters({}); setColumnSearches({}); }}>
            Clear all filters
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key} className={cn('text-xs', col.className, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
                <div className={cn('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        'flex items-center gap-1 hover:text-foreground transition-colors group text-left',
                        hasActiveFilter(col.key) && 'text-primary font-semibold'
                      )}>
                        <span>{col.header}</span>
                        {sortCol === col.key && sortDir === 'asc' && <ArrowUp className="h-3 w-3" />}
                        {sortCol === col.key && sortDir === 'desc' && <ArrowDown className="h-3 w-3" />}
                        {hasActiveFilter(col.key) && <Filter className="h-3 w-3 text-primary" />}
                        {!hasActiveFilter(col.key) && sortCol !== col.key && (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" align={col.align === 'right' ? 'end' : 'start'}>
                      <div className="p-2 space-y-1 border-b border-border/60">
                        <button
                          className={cn('flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors', sortCol === col.key && sortDir === 'asc' && 'bg-accent')}
                          onClick={() => { setSortCol(col.key); setSortDir('asc'); }}
                        >
                          <ArrowUp className="h-3 w-3" /> Sort ascending
                        </button>
                        <button
                          className={cn('flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors', sortCol === col.key && sortDir === 'desc' && 'bg-accent')}
                          onClick={() => { setSortCol(col.key); setSortDir('desc'); }}
                        >
                          <ArrowDown className="h-3 w-3" /> Sort descending
                        </button>
                      </div>
                      {col.filterable !== false && (
                        <div className="p-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Filter by column</span>
                            {hasActiveFilter(col.key) && (
                              <button className="text-[10px] text-primary hover:underline" onClick={() => clearColumnFilter(col.key)}>
                                Clear
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              placeholder="Search values..."
                              className="h-7 pl-7 text-xs"
                              value={columnSearches[col.key] || ''}
                              onChange={e => setColumnSearches(prev => ({ ...prev, [col.key]: e.target.value }))}
                            />
                          </div>
                          {distinctValues[col.key] && distinctValues[col.key].length <= 30 && (
                            <ScrollArea className="max-h-[160px]">
                              <div className="space-y-0.5">
                                {distinctValues[col.key].map(val => (
                                  <label key={val} className="flex items-center gap-2 px-1 py-1 text-xs hover:bg-accent rounded cursor-pointer">
                                    <Checkbox
                                      checked={columnFilters[col.key]?.has(val) || false}
                                      onCheckedChange={() => toggleDistinctValue(col.key, val)}
                                      className="h-3.5 w-3.5"
                                    />
                                    <span className="truncate">{val || '(empty)'}</span>
                                  </label>
                                ))}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, i) => (
              <TableRow key={rowKey(row, i)}>
                {columns.map(col => (
                  <TableCell key={col.key} className={cn('text-sm', col.className, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
                    {col.accessor(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
