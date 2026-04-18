import { useState, useMemo, useCallback, useEffect, ReactNode, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUp, ArrowDown, ArrowUpDown, Filter, X, Columns3, Bookmark, Save, Trash2, Check,
  Star, Download, FileText, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  ColumnType, FilterRule, RuleNode, Operator, evaluateRule, evaluateNodes, flattenNodes,
  getOperatorsForType, getDefaultOperator, describeRule, isGroup,
} from './filterOperators';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { Sparkline } from './Sparkline';
import {
  loadHiddenColumns, saveHiddenColumns,
  loadViews, upsertView, deleteView, togglePinView, setDefaultView, SavedReportView,
} from './reportViewStorage';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/reportExport';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | ReactNode;
  /** Raw sortable/filterable value — if not set, accessor is used */
  sortValue?: (row: T) => string | number;
  /** Column data type for filter operators. Defaults to 'text'. */
  type?: ColumnType;
  /** For type='sparkline' — return the historical numeric series. */
  trendValues?: (row: T) => number[];
  /** Alignment */
  align?: 'left' | 'right' | 'center';
  /** Fixed width class */
  className?: string;
  /** Disable column filtering */
  filterable?: boolean;
  /** Hide by default — user can enable from Columns menu */
  defaultHidden?: boolean;
}

interface ReportDataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
  /** Show the Advanced filter button above the table */
  showAdvancedFilter?: boolean;
  /** Stable identifier used for per-report localStorage (column visibility + saved views). */
  reportId?: string;
}

type SortDir = 'asc' | 'desc' | null;

const NO_VALUE_OPS: Operator[] = ['isEmpty', 'isNotEmpty', 'isToday', 'isYesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'];
const TWO_VALUE_OPS: Operator[] = ['between', 'notBetween', 'dateBetween'];

/** Auto-derive a stable id from the column header signature when no reportId is provided. */
function autoReportId<T>(cols: DataTableColumn<T>[]): string {
  return 'auto-' + cols.map(c => c.key).join('|').slice(0, 80);
}

export function ReportDataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data found',
  showAdvancedFilter = true,
  reportId,
}: ReportDataTableProps<T>) {
  const rid = reportId || autoReportId(columns);

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [columnRules, setColumnRules] = useState<Record<string, FilterRule | null>>({});
  const [advancedRules, setAdvancedRules] = useState<RuleNode[]>([]);

  // ---- Column visibility (persisted) ----
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    const stored = loadHiddenColumns(rid);
    if (stored.length > 0) return new Set(stored);
    // Initial: respect each column's defaultHidden
    return new Set(columns.filter(c => c.defaultHidden).map(c => c.key));
  });

  useEffect(() => {
    saveHiddenColumns(rid, Array.from(hiddenCols));
  }, [hiddenCols, rid]);

  const visibleColumns = useMemo(
    () => columns.filter(c => !hiddenCols.has(c.key)),
    [columns, hiddenCols]
  );

  // ---- Saved views ----
  const [views, setViews] = useState<SavedReportView[]>(() => loadViews(rid));
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const applyView = (view: SavedReportView) => {
    setAdvancedRules(view.rules);
    setHiddenCols(new Set(view.hiddenColumns));
    setSortCol(view.sortCol);
    setSortDir(view.sortDir);
    setColumnRules({});
    setActiveViewId(view.id);
  };

  const handleSaveView = (name: string) => {
    if (!name.trim()) return;
    // Combine inline column rules into the saved tree as top-level AND rules
    const inlineRules = Object.values(columnRules).filter((r): r is FilterRule => !!r);
    const view: SavedReportView = {
      id: crypto.randomUUID(),
      name: name.trim(),
      rules: [...inlineRules, ...advancedRules],
      hiddenColumns: Array.from(hiddenCols),
      sortCol,
      sortDir,
      createdAt: Date.now(),
    };
    const next = upsertView(rid, view);
    setViews(next);
    setActiveViewId(view.id);
  };

  const handleDeleteView = (id: string) => {
    const next = deleteView(rid, id);
    setViews(next);
    if (activeViewId === id) setActiveViewId(null);
  };

  // ---- Value extraction ----
  const getRawValue = useCallback((col: DataTableColumn<T>, row: T): string => {
    if (col.sortValue) return String(col.sortValue(row));
    const v = col.accessor(row);
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    return '';
  }, []);

  const getNumericValue = useCallback((col: DataTableColumn<T>, row: T): number | null => {
    if (col.type === 'sparkline' && col.trendValues) {
      const arr = col.trendValues(row);
      return arr && arr.length ? arr[arr.length - 1] : null;
    }
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

  // Column meta for the Advanced panel — includes ALL columns (visible or hidden)
  const advancedColMeta = useMemo(() =>
    columns.filter(c => c.filterable !== false).map(c => ({
      key: c.key,
      header: c.header,
      type: (c.type || 'text') as ColumnType,
      enumValues: distinctValues[c.key],
    })),
    [columns, distinctValues]
  );

  // Inline column rules — flat AND list
  const inlineRules = useMemo(
    () => Object.values(columnRules).filter((r): r is FilterRule => !!r),
    [columnRules]
  );

  // Apply rules: inline rules + advanced tree (groups support OR)
  const filteredData = useMemo(() => {
    if (inlineRules.length === 0 && advancedRules.length === 0) return data;
    return data.filter(row => {
      const evalSingle = (rule: FilterRule): boolean => {
        const col = colMap[rule.columnKey];
        if (!col) return true;
        const raw = getRawValue(col, row);
        const num = getNumericValue(col, row);
        const type = (col.type || 'text') as ColumnType;
        return evaluateRule(raw, num, rule, type);
      };
      // Inline rules: pure AND
      for (const r of inlineRules) if (!evalSingle(r)) return false;
      // Advanced: AND across nodes, OR/AND inside groups
      return evaluateNodes(advancedRules, evalSingle);
    });
  }, [data, inlineRules, advancedRules, colMap, getRawValue, getNumericValue]);

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
    setActiveViewId(null);
  };

  // Flat list of all rules — for chip rendering
  const allChipRules = useMemo(
    () => [...inlineRules, ...flattenNodes(advancedRules)],
    [inlineRules, advancedRules]
  );

  const totalActive = allChipRules.length;
  const showToolbar = showAdvancedFilter || totalActive > 0;

  return (
    <div>
      {showToolbar && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20 flex-wrap">
          {showAdvancedFilter && (
            <>
              <AdvancedFilterPanel columns={advancedColMeta} rules={advancedRules} onChange={setAdvancedRules} />
              <ColumnsMenu columns={columns} hiddenCols={hiddenCols} onChange={setHiddenCols} />
              <SavedViewsMenu
                views={views}
                activeId={activeViewId}
                onApply={applyView}
                onSave={handleSaveView}
                onDelete={handleDeleteView}
                hasState={totalActive > 0 || hiddenCols.size > 0 || !!sortCol}
              />
            </>
          )}
          {totalActive > 0 && (
            <>
              <div className="h-4 w-px bg-border/60" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {allChipRules.map(r => {
                  const col = colMap[r.columnKey];
                  return (
                    <Badge key={r.id} variant="secondary" className="text-[10px] gap-1 pl-2 pr-1 py-0.5">
                      {describeRule(r, col?.header || r.columnKey)}
                      <button
                        onClick={() => {
                          if (columnRules[r.columnKey]?.id === r.id) {
                            setColumnRule(r.columnKey, null);
                          } else {
                            // Remove from advanced tree (top-level rule or group child)
                            setAdvancedRules(prev => prev
                              .map(n => isGroup(n) ? { ...n, children: n.children.filter(c => c.id !== r.id) } : n)
                              .filter(n => isGroup(n) ? n.children.length > 0 : n.id !== r.id)
                            );
                          }
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
            {visibleColumns.map(col => (
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
              <TableCell colSpan={visibleColumns.length} className="text-center text-sm text-muted-foreground py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, i) => (
              <TableRow key={rowKey(row, i)}>
                {visibleColumns.map(col => (
                  <TableCell key={col.key} className={cn('text-sm', col.className, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
                    {col.type === 'sparkline' && col.trendValues
                      ? <Sparkline values={col.trendValues(row)} />
                      : col.accessor(row)}
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

// ============================================================================
// ColumnHeader (per-column popover with sort + filter)
// ============================================================================

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
                    type={type === 'number' || type === 'sparkline' ? 'number' : type === 'date' ? 'date' : 'text'}
                    value={draftVal}
                    onChange={(e) => setDraftVal(e.target.value)}
                    placeholder="Value"
                    className="h-7 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && apply()}
                  />
                )}
                {twoValue && (
                  <Input
                    type={type === 'number' || type === 'sparkline' ? 'number' : type === 'date' ? 'date' : 'text'}
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

// ============================================================================
// ColumnsMenu — show/hide toggle for any column
// ============================================================================

interface ColumnsMenuProps<T> {
  columns: DataTableColumn<T>[];
  hiddenCols: Set<string>;
  onChange: (next: Set<string>) => void;
}

function ColumnsMenu<T>({ columns, hiddenCols, onChange }: ColumnsMenuProps<T>) {
  const visibleCount = columns.length - hiddenCols.size;
  const toggle = (key: string) => {
    const next = new Set(hiddenCols);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(next);
  };
  const showAll = () => onChange(new Set());
  const hideAll = () => onChange(new Set(columns.slice(1).map(c => c.key))); // keep at least one

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-9 gap-2 text-xs', hiddenCols.size > 0 && 'border-primary text-primary')}>
          <Columns3 className="h-3.5 w-3.5" />
          Columns
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{visibleCount}/{columns.length}</Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Columns</span>
          <div className="flex gap-1">
            <button className="text-[10px] text-primary hover:underline" onClick={showAll}>All</button>
            <span className="text-[10px] text-muted-foreground">·</span>
            <button className="text-[10px] text-primary hover:underline" onClick={hideAll}>None</button>
          </div>
        </div>
        <ScrollArea className="max-h-[320px]">
          <div className="p-1">
            {columns.map(col => {
              const visible = !hiddenCols.has(col.key);
              return (
                <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-accent rounded cursor-pointer">
                  <Checkbox checked={visible} onCheckedChange={() => toggle(col.key)} className="h-3.5 w-3.5" />
                  <span className="truncate flex-1">{col.header}</span>
                  {col.type && col.type !== 'text' && (
                    <span className="text-[9px] text-muted-foreground uppercase">{col.type}</span>
                  )}
                </label>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// SavedViewsMenu — name + persist filter trees + visible columns
// ============================================================================

interface SavedViewsMenuProps {
  views: SavedReportView[];
  activeId: string | null;
  onApply: (view: SavedReportView) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  hasState: boolean;
}

function SavedViewsMenu({ views, activeId, onApply, onSave, onDelete, hasState }: SavedViewsMenuProps) {
  const [name, setName] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onSave(name);
    setName('');
  };

  const activeView = views.find(v => v.id === activeId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-9 gap-2 text-xs', activeId && 'border-primary text-primary')}>
          <Bookmark className={cn('h-3.5 w-3.5', activeId && 'fill-primary/20')} />
          {activeView ? activeView.name : 'Views'}
          {views.length > 0 && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{views.length}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="px-3 py-2 border-b border-border/60">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Saved views</span>
        </div>
        {views.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">
            No saved views yet.
          </div>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="p-1">
              {views.map(v => (
                <div key={v.id} className={cn('group flex items-center gap-1 px-2 py-1.5 rounded hover:bg-accent', v.id === activeId && 'bg-accent')}>
                  <button className="flex-1 text-left text-xs flex items-center gap-2 min-w-0" onClick={() => onApply(v)}>
                    {v.id === activeId ? <Check className="h-3 w-3 text-primary shrink-0" /> : <Bookmark className="h-3 w-3 text-muted-foreground shrink-0" />}
                    <span className="truncate">{v.name}</span>
                    <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
                      {v.rules.length}r · {v.hiddenColumns.length}h
                    </span>
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
                    onClick={(e) => { e.stopPropagation(); onDelete(v.id); }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="border-t border-border/60 p-2 space-y-2">
          <div className="text-[10px] text-muted-foreground">
            Save current filters, sort & visible columns
          </div>
          <div className="flex gap-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="View name"
              className="h-7 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              disabled={!hasState}
            />
            <Button size="sm" className="h-7 text-xs gap-1 px-2" onClick={submit} disabled={!hasState || !name.trim()}>
              <Save className="h-3 w-3" /> Save
            </Button>
          </div>
          {!hasState && (
            <div className="text-[10px] text-muted-foreground italic">
              Apply a filter, sort or hide columns first.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
