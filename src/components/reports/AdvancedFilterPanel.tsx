import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColumnType, FilterRule, Operator, getOperatorsForType, getDefaultOperator, describeRule } from './filterOperators';

interface ColumnMeta {
  key: string;
  header: string;
  type: ColumnType;
  enumValues?: string[];
}

interface AdvancedFilterPanelProps {
  columns: ColumnMeta[];
  rules: FilterRule[];
  onChange: (rules: FilterRule[]) => void;
}

const NO_VALUE_OPS: Operator[] = ['isEmpty', 'isNotEmpty', 'isToday', 'isYesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'];
const TWO_VALUE_OPS: Operator[] = ['between', 'notBetween', 'dateBetween'];

export function AdvancedFilterPanel({ columns, rules, onChange }: AdvancedFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const addRule = () => {
    const firstCol = columns[0];
    if (!firstCol) return;
    onChange([
      ...rules,
      { id: crypto.randomUUID(), columnKey: firstCol.key, operator: getDefaultOperator(firstCol.type) }
    ]);
  };

  const updateRule = (id: string, patch: Partial<FilterRule>) => {
    onChange(rules.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const removeRule = (id: string) => onChange(rules.filter(r => r.id !== id));
  const clearAll = () => onChange([]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-9 gap-2 text-xs', rules.length > 0 && 'border-primary text-primary')}>
          <Filter className="h-3.5 w-3.5" />
          Advanced filter
          {rules.length > 0 && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{rules.length}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[520px] sm:max-w-[520px] flex flex-col p-0">
        <SheetHeader className="px-5 py-4 border-b border-border/60">
          <SheetTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Advanced filter
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">Combine multiple conditions across columns. All rules apply (AND logic).</p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          {rules.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-12">
              No filter rules yet. Add one to begin filtering.
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule, idx) => {
                const col = columns.find(c => c.key === rule.columnKey);
                const colType = col?.type || 'text';
                const operators = getOperatorsForType(colType);
                const noValue = NO_VALUE_OPS.includes(rule.operator);
                const twoValue = TWO_VALUE_OPS.includes(rule.operator);
                const isEnum = rule.operator === 'in' || rule.operator === 'notIn';

                return (
                  <div key={rule.id} className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-6">{idx === 0 ? 'WHERE' : 'AND'}</span>
                      <Select value={rule.columnKey} onValueChange={(v) => {
                        const newCol = columns.find(c => c.key === v);
                        updateRule(rule.id, { columnKey: v, operator: getDefaultOperator(newCol?.type || 'text'), value: undefined, value2: undefined, values: undefined });
                      }}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {columns.map(c => (
                            <SelectItem key={c.key} value={c.key} className="text-xs">{c.header}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRule(rule.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 pl-8">
                      <Select value={rule.operator} onValueChange={(v) => updateRule(rule.id, { operator: v as Operator, value: undefined, value2: undefined })}>
                        <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {operators.map(o => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {!noValue && !isEnum && (
                        <Input
                          type={colType === 'number' ? 'number' : colType === 'date' ? 'date' : 'text'}
                          value={rule.value ?? ''}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          className="h-8 text-xs flex-1"
                          placeholder="Value"
                        />
                      )}
                      {twoValue && (
                        <Input
                          type={colType === 'number' ? 'number' : colType === 'date' ? 'date' : 'text'}
                          value={rule.value2 ?? ''}
                          onChange={(e) => updateRule(rule.id, { value2: e.target.value })}
                          className="h-8 text-xs flex-1"
                          placeholder="And"
                        />
                      )}
                      {isEnum && col?.enumValues && (
                        <div className="flex flex-wrap gap-1 flex-1">
                          {col.enumValues.slice(0, 30).map(v => {
                            const selected = (rule.values || []).includes(v);
                            return (
                              <button
                                key={v}
                                onClick={() => {
                                  const cur = rule.values || [];
                                  updateRule(rule.id, { values: selected ? cur.filter(x => x !== v) : [...cur, v] });
                                }}
                                className={cn('text-[10px] px-2 py-0.5 rounded-full border transition-colors', selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-accent')}
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="pl-8 text-[10px] text-muted-foreground italic">
                      {describeRule(rule, col?.header || rule.columnKey)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={addRule}>
            <Plus className="h-3.5 w-3.5" /> Add rule
          </Button>
          <div className="flex gap-2">
            {rules.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={clearAll}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            )}
            <Button size="sm" className="text-xs h-8" onClick={() => setOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
