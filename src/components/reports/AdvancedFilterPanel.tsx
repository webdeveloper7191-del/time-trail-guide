import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Plus, Trash2, X, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ColumnType, FilterRule, FilterGroup, RuleNode, Operator,
  getOperatorsForType, getDefaultOperator, describeRule, isGroup,
} from './filterOperators';

interface ColumnMeta {
  key: string;
  header: string;
  type: ColumnType;
  enumValues?: string[];
}

interface AdvancedFilterPanelProps {
  columns: ColumnMeta[];
  rules: RuleNode[];
  onChange: (rules: RuleNode[]) => void;
}

const NO_VALUE_OPS: Operator[] = ['isEmpty', 'isNotEmpty', 'isToday', 'isYesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'];
const TWO_VALUE_OPS: Operator[] = ['between', 'notBetween', 'dateBetween'];

function newRule(columns: ColumnMeta[]): FilterRule {
  const c = columns[0];
  return { id: crypto.randomUUID(), columnKey: c?.key || '', operator: getDefaultOperator(c?.type || 'text') };
}

function newGroup(columns: ColumnMeta[]): FilterGroup {
  return {
    id: crypto.randomUUID(),
    type: 'group',
    connector: 'OR',
    children: [newRule(columns), newRule(columns)],
  };
}

function totalRuleCount(nodes: RuleNode[]): number {
  return nodes.reduce((acc, n) => acc + (isGroup(n) ? n.children.length : 1), 0);
}

export function AdvancedFilterPanel({ columns, rules, onChange }: AdvancedFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const addRule = () => onChange([...rules, newRule(columns)]);
  const addGroup = () => onChange([...rules, newGroup(columns)]);
  const removeNode = (id: string) => onChange(rules.filter(n => n.id !== id));
  const updateNode = (id: string, patch: Partial<RuleNode>) =>
    onChange(rules.map(n => n.id === id ? ({ ...n, ...patch } as RuleNode) : n));
  const clearAll = () => onChange([]);

  const updateGroupChild = (groupId: string, childId: string, patch: Partial<FilterRule>) => {
    onChange(rules.map(n => {
      if (n.id !== groupId || !isGroup(n)) return n;
      return { ...n, children: n.children.map(c => c.id === childId ? { ...c, ...patch } : c) };
    }));
  };

  const addGroupChild = (groupId: string) => {
    onChange(rules.map(n => {
      if (n.id !== groupId || !isGroup(n)) return n;
      return { ...n, children: [...n.children, newRule(columns)] };
    }));
  };

  const removeGroupChild = (groupId: string, childId: string) => {
    onChange(rules.map(n => {
      if (n.id !== groupId || !isGroup(n)) return n;
      return { ...n, children: n.children.filter(c => c.id !== childId) };
    }));
  };

  const count = totalRuleCount(rules);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-9 gap-2 text-xs', count > 0 && 'border-primary text-primary')}>
          <Filter className="h-3.5 w-3.5" />
          Advanced filter
          {count > 0 && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{count}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[560px] sm:max-w-[560px] flex flex-col p-0">
        <SheetHeader className="px-5 py-4 border-b border-border/60">
          <SheetTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Advanced filter
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">
            Top-level rules are combined with <span className="font-medium">AND</span>. Add a group to combine sub-rules with <span className="font-medium">OR</span>.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          {rules.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-12">
              No filter rules yet. Add a rule or group to begin filtering.
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((node, idx) => {
                const connectorLabel = idx === 0 ? 'WHERE' : 'AND';
                if (isGroup(node)) {
                  return (
                    <GroupBlock
                      key={node.id}
                      group={node}
                      columns={columns}
                      connectorLabel={connectorLabel}
                      onConnectorChange={(c) => updateNode(node.id, { connector: c })}
                      onAddChild={() => addGroupChild(node.id)}
                      onUpdateChild={(cid, patch) => updateGroupChild(node.id, cid, patch)}
                      onRemoveChild={(cid) => removeGroupChild(node.id, cid)}
                      onRemove={() => removeNode(node.id)}
                    />
                  );
                }
                return (
                  <RuleRow
                    key={node.id}
                    rule={node}
                    columns={columns}
                    connectorLabel={connectorLabel}
                    onChange={(patch) => updateNode(node.id, patch)}
                    onRemove={() => removeNode(node.id)}
                  />
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={addRule}>
              <Plus className="h-3.5 w-3.5" /> Add rule
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={addGroup}>
              <FolderPlus className="h-3.5 w-3.5" /> Add OR group
            </Button>
          </div>
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

interface RuleRowProps {
  rule: FilterRule;
  columns: ColumnMeta[];
  connectorLabel: string;
  onChange: (patch: Partial<FilterRule>) => void;
  onRemove: () => void;
  compact?: boolean;
}

function RuleRow({ rule, columns, connectorLabel, onChange, onRemove, compact }: RuleRowProps) {
  const col = columns.find(c => c.key === rule.columnKey);
  const colType = (col?.type || 'text') as ColumnType;
  const operators = getOperatorsForType(colType);
  const noValue = NO_VALUE_OPS.includes(rule.operator);
  const twoValue = TWO_VALUE_OPS.includes(rule.operator);
  const isEnum = rule.operator === 'in' || rule.operator === 'notIn';

  return (
    <div className={cn('rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2', compact && 'p-2 space-y-1.5')}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12 shrink-0">{connectorLabel}</span>
        <Select value={rule.columnKey} onValueChange={(v) => {
          const newCol = columns.find(c => c.key === v);
          onChange({ columnKey: v, operator: getDefaultOperator(newCol?.type || 'text'), value: undefined, value2: undefined, values: undefined });
        }}>
          <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {columns.map(c => (
              <SelectItem key={c.key} value={c.key} className="text-xs">{c.header}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex items-center gap-2 pl-14">
        <Select value={rule.operator} onValueChange={(v) => onChange({ operator: v as Operator, value: undefined, value2: undefined })}>
          <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {operators.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!noValue && !isEnum && (
          <Input
            type={colType === 'number' || colType === 'sparkline' ? 'number' : colType === 'date' ? 'date' : 'text'}
            value={rule.value ?? ''}
            onChange={(e) => onChange({ value: e.target.value })}
            className="h-8 text-xs flex-1"
            placeholder="Value"
          />
        )}
        {twoValue && (
          <Input
            type={colType === 'number' || colType === 'sparkline' ? 'number' : colType === 'date' ? 'date' : 'text'}
            value={rule.value2 ?? ''}
            onChange={(e) => onChange({ value2: e.target.value })}
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
                    onChange({ values: selected ? cur.filter(x => x !== v) : [...cur, v] });
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
      <div className="pl-14 text-[10px] text-muted-foreground italic">
        {describeRule(rule, col?.header || rule.columnKey)}
      </div>
    </div>
  );
}

interface GroupBlockProps {
  group: FilterGroup;
  columns: ColumnMeta[];
  connectorLabel: string;
  onConnectorChange: (c: 'AND' | 'OR') => void;
  onAddChild: () => void;
  onUpdateChild: (childId: string, patch: Partial<FilterRule>) => void;
  onRemoveChild: (childId: string) => void;
  onRemove: () => void;
}

function GroupBlock({ group, columns, connectorLabel, onConnectorChange, onAddChild, onUpdateChild, onRemoveChild, onRemove }: GroupBlockProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12 shrink-0">{connectorLabel}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Group · match</span>
        <Select value={group.connector} onValueChange={(v) => onConnectorChange(v as 'AND' | 'OR')}>
          <SelectTrigger className="h-7 text-xs w-[80px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="AND" className="text-xs">All (AND)</SelectItem>
            <SelectItem value="OR" className="text-xs">Any (OR)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground">of the following</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-auto" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      <div className="space-y-1.5 pl-3 border-l-2 border-primary/20 ml-4">
        {group.children.map((child, i) => (
          <RuleRow
            key={child.id}
            rule={child}
            columns={columns}
            connectorLabel={i === 0 ? '' : group.connector}
            onChange={(patch) => onUpdateChild(child.id, patch)}
            onRemove={() => onRemoveChild(child.id)}
            compact
          />
        ))}
        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5 ml-14" onClick={onAddChild}>
          <Plus className="h-3 w-3" /> Add condition
        </Button>
      </div>
    </div>
  );
}
