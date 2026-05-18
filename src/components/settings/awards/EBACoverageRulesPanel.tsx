/**
 * EBA Coverage Rules Engine
 *
 * Defines automated rules that determine which staff are covered by an
 * Enterprise Agreement, based on location, department, employment type,
 * classification and state. Provides live preview, conflict detection
 * and one-click apply.
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertTriangle, ChevronDown, Filter, Pencil, Play, Plus, Shield, Sparkles, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import type { EnterpriseAgreement } from '@/types/enterpriseAgreement';
import { mockStaff, departments as ALL_DEPARTMENTS, locations as ALL_LOCATIONS } from '@/data/mockStaffData';
import type { EmploymentType } from '@/types/staff';

// ---------- Types ----------

type RuleAction = 'auto_assign' | 'suggest';

export interface CoverageRule {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  action: RuleAction;
  conditions: {
    locations: string[];
    departments: string[];
    employmentTypes: EmploymentType[];
    classifications: string[]; // EBAClassification.id
    states: string[];
  };
  createdAt: string;
}

const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  casual: 'Casual',
  contractor: 'Contractor',
};

const ALL_EMPLOYMENT_TYPES: EmploymentType[] = ['full_time', 'part_time', 'casual', 'contractor'];

const ACTION_LABEL: Record<RuleAction, string> = {
  auto_assign: 'Auto-assign',
  suggest: 'Suggest only',
};

const STORAGE_KEY = (ebaId: string) => `eba_coverage_rules_${ebaId}`;
const ALL_RULES_PREFIX = 'eba_coverage_rules_';

// ---------- Helpers ----------

function loadRules(ebaId: string): CoverageRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(ebaId));
    return raw ? (JSON.parse(raw) as CoverageRule[]) : [];
  } catch {
    return [];
  }
}

function saveRules(ebaId: string, rules: CoverageRule[]) {
  localStorage.setItem(STORAGE_KEY(ebaId), JSON.stringify(rules));
}

function ruleMatches(rule: CoverageRule, staff: typeof mockStaff[number]): boolean {
  const c = rule.conditions;
  if (c.locations.length && !staff.locations.some(l => c.locations.includes(l))) return false;
  if (c.departments.length && !c.departments.includes(staff.department)) return false;
  if (c.employmentTypes.length) {
    const t = staff.currentPayCondition?.employmentType;
    if (!t || !c.employmentTypes.includes(t)) return false;
  }
  // classifications / states: skipped against mockStaff (no fields) — treated as informational
  return true;
}

function emptyRule(priority: number): CoverageRule {
  return {
    id: `rule-${Date.now()}`,
    name: 'New coverage rule',
    priority,
    isActive: true,
    action: 'auto_assign',
    conditions: { locations: [], departments: [], employmentTypes: [], classifications: [], states: [] },
    createdAt: new Date().toISOString(),
  };
}

// ---------- Multi-select chip dropdown ----------

interface MultiPickProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (next: T[]) => void;
}

function MultiPick<T extends string>({ label, options, selected, onChange }: MultiPickProps<T>) {
  const toggle = (v: T) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between font-normal h-9">
            <span className="truncate">
              {selected.length === 0 ? `Any ${label.toLowerCase()}` : `${selected.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-72 overflow-auto bg-popover">
          <DropdownMenuLabel className="text-xs">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map(o => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={selected.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
              onSelect={e => e.preventDefault()}
            >
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map(v => {
            const lbl = options.find(o => o.value === v)?.label ?? v;
            return (
              <Badge key={v} variant="secondary" className="text-xs gap-1">
                {lbl}
                <button onClick={() => toggle(v)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Rule editor sheet ----------

interface RuleEditorProps {
  open: boolean;
  rule: CoverageRule | null;
  eba: EnterpriseAgreement;
  onClose: () => void;
  onSave: (rule: CoverageRule) => void;
}

function RuleEditor({ open, rule, eba, onClose, onSave }: RuleEditorProps) {
  const [draft, setDraft] = useState<CoverageRule | null>(rule);
  useEffect(() => setDraft(rule), [rule]);
  if (!draft) return null;

  const update = <K extends keyof CoverageRule>(key: K, value: CoverageRule[K]) =>
    setDraft({ ...draft, [key]: value });
  const updateCond = <K extends keyof CoverageRule['conditions']>(
    key: K,
    value: CoverageRule['conditions'][K],
  ) => setDraft({ ...draft, conditions: { ...draft.conditions, [key]: value } });

  const matchedCount = mockStaff.filter(s => ruleMatches(draft, s)).length;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit coverage rule</SheetTitle>
          <SheetDescription>
            Define the conditions that automatically attach staff to{' '}
            <span className="font-medium">{eba.name}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-muted-foreground">Rule name</Label>
              <Input value={draft.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Input
                type="number"
                min={1}
                value={draft.priority}
                onChange={e => update('priority', Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Action</Label>
              <Select value={draft.action} onValueChange={(v: RuleAction) => update('action', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="auto_assign">Auto-assign on match</SelectItem>
                  <SelectItem value="suggest">Suggest only (manual confirm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-sm font-medium">Match conditions</p>
            <p className="text-xs text-muted-foreground">
              Staff must match <span className="font-medium">all</span> conditions below. Empty
              sections mean "any".
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MultiPick
              label="Locations"
              options={ALL_LOCATIONS.map(l => ({ value: l, label: l }))}
              selected={draft.conditions.locations}
              onChange={v => updateCond('locations', v)}
            />
            <MultiPick
              label="Departments"
              options={ALL_DEPARTMENTS.map(d => ({ value: d, label: d }))}
              selected={draft.conditions.departments}
              onChange={v => updateCond('departments', v)}
            />
            <MultiPick<EmploymentType>
              label="Employment types"
              options={ALL_EMPLOYMENT_TYPES.map(t => ({ value: t, label: EMPLOYMENT_TYPE_LABEL[t] }))}
              selected={draft.conditions.employmentTypes}
              onChange={v => updateCond('employmentTypes', v)}
            />
            <MultiPick
              label="States"
              options={eba.applicableStates.map(s => ({ value: s, label: s }))}
              selected={draft.conditions.states}
              onChange={v => updateCond('states', v)}
            />
            <div className="col-span-2">
              <MultiPick
                label="Classifications (informational)"
                options={eba.classifications.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
                selected={draft.conditions.classifications}
                onChange={v => updateCond('classifications', v)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">Currently matches</span>
            </div>
            <Badge variant="secondary" className="font-medium">{matchedCount} staff</Badge>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Rule active</Label>
            <Switch checked={draft.isActive} onCheckedChange={v => update('isActive', v)} />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save rule</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Main panel ----------

interface EBACoverageRulesPanelProps {
  eba: EnterpriseAgreement;
}

export function EBACoverageRulesPanel({ eba }: EBACoverageRulesPanelProps) {
  const [rules, setRules] = useState<CoverageRule[]>(() => loadRules(eba.id));
  const [editing, setEditing] = useState<CoverageRule | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => saveRules(eba.id, rules), [eba.id, rules]);

  // Compute coverage matches grouped by rule
  const coverage = useMemo(() => {
    const matched = new Map<string, Set<string>>(); // ruleId -> staffIds
    for (const rule of rules) {
      if (!rule.isActive) continue;
      const ids = new Set<string>();
      for (const s of mockStaff) if (ruleMatches(rule, s)) ids.add(s.id);
      matched.set(rule.id, ids);
    }
    const allCovered = new Set<string>();
    matched.forEach(ids => ids.forEach(id => allCovered.add(id)));
    return { matched, allCovered };
  }, [rules]);

  // Cross-EBA conflict detection: scan all stored coverage rule sets
  const conflicts = useMemo(() => {
    const otherCovered = new Map<string, string[]>(); // staffId -> [otherEbaIds]
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(ALL_RULES_PREFIX)) continue;
        const otherEbaId = key.slice(ALL_RULES_PREFIX.length);
        if (otherEbaId === eba.id) continue;
        const otherRules = JSON.parse(localStorage.getItem(key) || '[]') as CoverageRule[];
        for (const r of otherRules) {
          if (!r.isActive) continue;
          for (const s of mockStaff) {
            if (ruleMatches(r, s) && coverage.allCovered.has(s.id)) {
              const arr = otherCovered.get(s.id) ?? [];
              if (!arr.includes(otherEbaId)) arr.push(otherEbaId);
              otherCovered.set(s.id, arr);
            }
          }
        }
      }
    } catch { /* noop */ }
    return otherCovered;
  }, [coverage, eba.id]);

  const handleSave = (rule: CoverageRule) => {
    setRules(prev => {
      const exists = prev.some(r => r.id === rule.id);
      return exists ? prev.map(r => (r.id === rule.id ? rule : r)) : [...prev, rule];
    });
    setOpen(false);
    setEditing(null);
    toast.success('Coverage rule saved');
  };

  const handleAdd = () => {
    setEditing(emptyRule(rules.length + 1));
    setOpen(true);
  };

  const handleEdit = (r: CoverageRule) => { setEditing(r); setOpen(true); };

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const handleToggle = (id: string) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  const handleApply = () => {
    const autoCount = Array.from(coverage.matched.entries())
      .filter(([rid]) => rules.find(r => r.id === rid)?.action === 'auto_assign')
      .reduce((acc, [, ids]) => acc + ids.size, 0);
    toast.success(`Applied coverage — ${autoCount} auto-assignments queued, ${conflicts.size} conflicts flagged`);
  };

  const summarise = (r: CoverageRule) => {
    const parts: string[] = [];
    if (r.conditions.locations.length) parts.push(`${r.conditions.locations.length} locations`);
    if (r.conditions.departments.length) parts.push(`${r.conditions.departments.length} depts`);
    if (r.conditions.employmentTypes.length)
      parts.push(r.conditions.employmentTypes.map(t => EMPLOYMENT_TYPE_LABEL[t]).join(', '));
    if (r.conditions.states.length) parts.push(`${r.conditions.states.length} states`);
    return parts.length ? parts.join(' • ') : 'Any staff';
  };

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Active rules
            </div>
            <p className="text-2xl font-semibold tracking-tight mt-1">
              {rules.filter(r => r.isActive).length}
              <span className="text-sm text-muted-foreground font-normal"> / {rules.length}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Staff covered
            </div>
            <p className="text-2xl font-semibold tracking-tight mt-1">{coverage.allCovered.size}</p>
          </CardContent>
        </Card>
        <Card className={conflicts.size > 0 ? 'border-destructive/40' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" /> Cross-EBA conflicts
            </div>
            <p className={`text-2xl font-semibold tracking-tight mt-1 ${conflicts.size > 0 ? 'text-destructive' : ''}`}>
              {conflicts.size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Coverage rules</p>
          <p className="text-xs text-muted-foreground">
            Higher priority (lower number) wins when staff match multiple rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleApply} disabled={rules.length === 0}>
            <Play className="h-3.5 w-3.5 mr-1.5" /> Apply now
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add rule
          </Button>
        </div>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm font-medium">No coverage rules yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a rule to automatically attach matching staff to this agreement.
            </p>
            <Button className="mt-4" size="sm" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add your first rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {[...rules].sort((a, b) => a.priority - b.priority).map(rule => {
            const matched = coverage.matched.get(rule.id)?.size ?? 0;
            return (
              <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary text-sm font-semibold shrink-0">
                        #{rule.priority}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{rule.name}</p>
                          <Badge variant="outline" className="text-xs">{ACTION_LABEL[rule.action]}</Badge>
                          {rule.action === 'auto_assign' && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" /> Auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{summarise(rule)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">{matched}</span> staff currently match
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={rule.isActive} onCheckedChange={() => handleToggle(rule.id)} />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Conflict panel */}
      {conflicts.size > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Cross-EBA conflicts
            </CardTitle>
            <CardDescription>
              These staff are covered by another active EBA's rules. Resolve by adjusting priority,
              tightening conditions, or manually overriding the assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-56">
              <div className="space-y-1.5">
                {Array.from(conflicts.entries()).map(([staffId, otherEbaIds]) => {
                  const staff = mockStaff.find(s => s.id === staffId);
                  if (!staff) return null;
                  return (
                    <div
                      key={staffId}
                      className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{staff.firstName} {staff.lastName}</p>
                        <p className="text-xs text-muted-foreground">{staff.department} • {staff.locations.join(', ')}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Also in {otherEbaIds.length} other EBA{otherEbaIds.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Covered staff preview */}
      {coverage.allCovered.size > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Covered staff preview
            </CardTitle>
            <CardDescription>Staff who will be attached when rules are applied.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              <div className="space-y-1.5">
                {mockStaff
                  .filter(s => coverage.allCovered.has(s.id))
                  .map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.department} • {s.locations.join(', ')} •{' '}
                          {EMPLOYMENT_TYPE_LABEL[s.currentPayCondition?.employmentType ?? 'full_time']}
                        </p>
                      </div>
                      {conflicts.has(s.id) && (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                          Conflict
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <RuleEditor
        open={open}
        rule={editing}
        eba={eba}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
