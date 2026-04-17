import { useState, useMemo, useCallback, ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowUpDown, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ColumnType, FilterRule, Operator, evaluateRule, getOperatorsForType, getDefaultOperator, describeRule,
} from './filterOperators';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | ReactNode;
  /** Raw sortable/filterable value — if not set, accessor is used */
  sortValue?: (row: T) => string | number;
  /** Column data type for filter operators. Defaults to 'text'. */
  type?: ColumnType;
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
  /** Show the Advanced filter button above the table */
  showAdvancedFilter?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

const NO_VALUE_OPS: Operator[] = ['isEmpty', 'isNotEmpty', 'isToday', 'isYesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'];
const TWO_VALUE_OPS: Operator[] = ['between', 'notBetween', 'dateBetween'];

export function ReportDataTable<T>({ columns, data, rowKey, emptyMessage = 'No data found', showAdvancedFilter = true }: ReportDataTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [columnRules, setColumnRules] = useState<Record<string, FilterRule | null>>({});
  const [advancedRules, setAdvancedRules] = useState<FilterRule[]>([]);

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

  const colMap = useMemo(() => {
    const m: Record<string, DataTableColumn<T>> = {};
    columns.forEach(c => { m[c.key] = c; });
    return m;
  }, [columns]);

  // Distinct values for enum-style columns
  const distinctValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    columns.forEach(col => {
      if (col.filterable === false) return;
      const vals = new Set<string>();
      data.forEach(row => vals.add(getRawValue(col, row)));
      map[col.key] = Array.from(vals).filter(v => v !== '').sort();
    });
    return map;
  }, [columns, data, getRawValue]);

  // Column meta for the Advanced panel
  const advancedColMeta = useMemo(() =>
    columns.filter(c => c.filterable !== false).map(c => ({
      key: c.key,
      header: c.header,
      type: (c.type || 'text') as ColumnType,
      enumValues: distinctValues[c.key],
    })),
    [columns, distinctValues]
  );

  // All active rules combined
  const allActiveRules = useMemo(() => {
    const inline = Object.values(columnRules).filter((r): r is FilterRule => !!r);
    return [...inline, ...advancedRules];
  }, [columnRules, advancedRules]);

  // Apply rules
  const filteredData = useMemo(() => {
    if (allActiveRules.length === 0) return data;
    return data.filter(row => {
      for (const rule of allActiveRules) {
        const col = colMap[rule.columnKey];
        if (!col) continue;
        const raw = getRawValue(col, row);
        const num = getNumericValue(col, row);
        const type = (col.type || 'text') as ColumnType;
        if (!evaluateRule(raw, num, rule, type)) return false;
      }
      return true;
    });
  }, [data, allActiveRules, colMap, getRawValue, getNumericValue]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortCol || !sortDir) return filteredData;
    const col = colMap[sortCol];
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
  }, [filteredData, sortCol, sortDir, colMap, getRawValue, getNumericValue]);

  const setColumnRule = (colKey: string, rule: FilterRule | null) => {
    setColumnRules(prev => ({ ...prev, [colKey]: rule }));
  };

  const clearAllFilters = () => {
    setColumnRules({});
    setAdvancedRules([]);
  };

  const totalActive = allActiveRules.length;

  return (
    <div>
      {(showAdvancedFilter || totalActive > 0) && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20">
          {showAdvancedFilter && (
            <AdvancedFilterPanel columns={advancedColMeta} rules={advancedRules} onChange={setAdvancedRules} />
          )}
          {totalActive > 0 && (
            <>
              <div className="h-4 w-px bg-border/60" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {allActiveRules.map(r => {
                  const col = colMap[r.columnKey];
                  return (
                    <Badge key={r.id} variant="secondary" className="text-[10px] gap-1 pl-2 pr-1 py-0.5">
                      {describeRule(r, col?.header || r.columnKey)}
                      <button
                        onClick={() => {
                          if (columnRules[r.columnKey]?.id === r.id) setColumnRule(r.columnKey, null);
                          else setAdvancedRules(prev => prev.filter(x => x.id !== r.id));
                        }}
                        className="hover:bg-muted-foreground/20 rounded p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 ml-auto" onClick={clearAllFilters}>
                Clear all
              </Button>
              <span className="text-[10px] text-muted-foreground">{sortedData.length} of {data.length}</span>
            </>
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <ColumnHeader
                key={col.key}
                col={col}
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(dir) => { setSortCol(col.key); setSortDir(dir); }}
                onClearSort={() => { setSortCol(null); setSortDir(null); }}
                rule={columnRules[col.key] || null}
                onRuleChange={(rule) => setColumnRule(col.key, rule)}
                distinctValues={distinctValues[col.key] || []}
              />
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

interface ColumnHeaderProps<T> {
  col: DataTableColumn<T>;
  sortCol: string | null;
  sortDir: SortDir;
  onSort: (dir: 'asc' | 'desc') => void;
  onClearSort: () => void;
  rule: FilterRule | null;
  onRuleChange: (rule: FilterRule | null) => void;
  distinctValues: string[];
}

function ColumnHeader<T>({ col, sortCol, sortDir, onSort, onClearSort, rule, onRuleChange, distinctValues }: ColumnHeaderProps<T>) {
  const type = (col.type || 'text') as ColumnType;
  const operators = getOperatorsForType(type);
  const hasFilter = !!rule;
  const isSorted = sortCol === col.key;

  // Local draft state for the popover
  const [draftOp, setDraftOp] = useState<Operator>(rule?.operator || getDefaultOperator(type));
  const [draftVal, setDraftVal] = useState<string>(rule?.value !== undefined ? String(rule.value) : '');
  const [draftVal2, setDraftVal2] = useState<string>(rule?.value2 !== undefined ? String(rule.value2) : '');
  const [draftValues, setDraftValues] = useState<string[]>(rule?.values || []);

  const noValue = NO_VALUE_OPS.includes(draftOp);
  const twoValue = TWO_VALUE_OPS.includes(draftOp);
  const isEnumOp = draftOp === 'in' || draftOp === 'notIn';

  const apply = () => {
    if (noValue) {
      onRuleChange({ id: rule?.id || crypto.randomUUID(), columnKey: col.key, operator: draftOp });
    } else if (isEnumOp) {
      onRuleChange({ id: rule?.id || crypto.randomUUID(), columnKey: col.key, operator: draftOp, values: draftValues });
    } else if (twoValue) {
      if (draftVal === '' || draftVal2 === '') return;
      onRuleChange({ id: rule?.id || crypto.randomUUID(), columnKey: col.key, operator: draftOp, value: draftVal, value2: draftVal2 });
    } else {
      if (draftVal === '') return;
      onRuleChange({ id: rule?.id || crypto.randomUUID(), columnKey: col.key, operator: draftOp, value: draftVal });
    }
  };

  const clear = () => {
    onRuleChange(null);
    setDraftOp(getDefaultOperator(type));
    setDraftVal('');
    setDraftVal2('');
    setDraftValues([]);
  };

  return (
    <TableHead className={cn('text-xs', col.className, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
      <div className={cn('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex items-center gap-1 hover:text-foreground transition-colors group text-left',
              hasFilter && 'text-primary font-semibold'
            )}>
              <span>{col.header}</span>
              {isSorted && sortDir === 'asc' && <ArrowUp className="h-3 w-3" />}
              {isSorted && sortDir === 'desc' && <ArrowDown className="h-3 w-3" />}
              {hasFilter && <Filter className="h-3 w-3 text-primary fill-primary/20" />}
              {!hasFilter && !isSorted && (
                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align={col.align === 'right' ? 'end' : 'start'}>
            <div className="p-2 space-y-1 border-b border-border/60">
              <button
                className={cn('flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors', isSorted && sortDir === 'asc' && 'bg-accent')}
                onClick={() => onSort('asc')}
              >
                <ArrowUp className="h-3 w-3" /> Sort ascending
              </button>
              <button
                className={cn('flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors', isSorted && sortDir === 'desc' && 'bg-accent')}
                onClick={() => onSort('desc')}
              >
                <ArrowDown className="h-3 w-3" /> Sort descending
              </button>
              {isSorted && (
                <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors text-muted-foreground" onClick={onClearSort}>
                  <X className="h-3 w-3" /> Clear sort
                </button>
              )}
            </div>
            {col.filterable !== false && (
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Filter</span>
                  {hasFilter && (
                    <button className="text-[10px] text-primary hover:underline" onClick={clear}>
                      Clear
                    </button>
                  )}
                </div>
                <Select value={draftOp} onValueChange={(v) => setDraftOp(v as Operator)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {operators.map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!noValue && !isEnumOp && (
                  <Input
                    type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                    value={draftVal}
                    onChange={(e) => setDraftVal(e.target.value)}
                    placeholder="Value"
                    className="h-7 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && apply()}
                  />
                )}
                {twoValue && (
                  <Input
                    type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                    value={draftVal2}
                    onChange={(e) => setDraftVal2(e.target.value)}
                    placeholder="And"
                    className="h-7 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && apply()}
                  />
                )}
                {isEnumOp && distinctValues.length > 0 && (
                  <ScrollArea className="max-h-[140px]">
                    <div className="space-y-0.5">
                      {distinctValues.slice(0, 50).map(v => {
                        const checked = draftValues.includes(v);
                        return (
                          <label key={v} className="flex items-center gap-2 px-1 py-1 text-xs hover:bg-accent rounded cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => setDraftValues(prev => checked ? prev.filter(x => x !== v) : [...prev, v])}
                              className="h-3.5 w-3.5"
                            />
                            <span className="truncate">{v || '(empty)'}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
                <Button size="sm" className="w-full h-7 text-xs" onClick={apply}>
                  Apply filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </TableHead>
  );
}
