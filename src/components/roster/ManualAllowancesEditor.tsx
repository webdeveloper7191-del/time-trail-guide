import { Shift, ManualAllowance } from '@/types/roster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  shift: Shift;
  onChange: (shift: Shift) => void;
}

const PRESETS: { code: string; label: string; rate: number; unit: string }[] = [
  { code: 'FIRST_AID', label: 'First Aid Allowance', rate: 3.32, unit: 'day' },
  { code: 'NQA_LEADERSHIP', label: 'NQA Leadership', rate: 7.23, unit: 'day' },
  { code: 'HIGHER_DUTIES', label: 'Higher Duties', rate: 2.50, unit: 'hr' },
  { code: 'VEHICLE', label: 'Vehicle / KM', rate: 0.96, unit: 'km' },
  { code: 'MEAL', label: 'Meal Allowance', rate: 16.85, unit: 'occurrence' },
  { code: 'UNIFORM', label: 'Uniform / Laundry', rate: 1.25, unit: 'day' },
  { code: 'ON_CALL', label: 'On-Call', rate: 15.42, unit: 'day' },
  { code: 'SLEEPOVER', label: 'Sleepover', rate: 69.85, unit: 'occurrence' },
  { code: 'BROKEN_SHIFT', label: 'Broken Shift', rate: 18.46, unit: 'occurrence' },
  { code: 'CUSTOM', label: 'Custom allowance…', rate: 0, unit: 'occurrence' },
];

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export function ManualAllowancesEditor({ shift, onChange }: Props) {
  const items = shift.manualAllowances ?? [];

  const update = (next: ManualAllowance[]) =>
    onChange({ ...shift, manualAllowances: next });

  const addPreset = (code: string) => {
    const preset = PRESETS.find(p => p.code === code);
    if (!preset) return;
    const isCustom = code === 'CUSTOM';
    update([
      ...items,
      {
        id: `ma-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        code: isCustom ? 'CUSTOM' : preset.code,
        label: isCustom ? '' : preset.label,
        rate: preset.rate,
        units: 1,
        unit: preset.unit,
      },
    ]);
  };

  const patch = (id: string, changes: Partial<ManualAllowance>) => {
    update(items.map(i => (i.id === id ? { ...i, ...changes } : i)));
  };

  const remove = (id: string) => update(items.filter(i => i.id !== id));

  const total = items.reduce((sum, i) => sum + i.rate * i.units, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          Manually add allowances that apply to this shift.
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Plus className="h-4 w-4" />
              Add allowance
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
            {PRESETS.map(p => (
              <DropdownMenuItem key={p.code} onSelect={() => addPreset(p.code)}>
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">No manual allowances added.</p>
          <p className="text-xs text-muted-foreground/70">
            Use "Add allowance" above to include a one-off payment on this shift.
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr_auto] gap-2 px-3 py-2 bg-muted/50 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            <span>Allowance</span>
            <span>Rate ($)</span>
            <span>Units</span>
            <span>Unit</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          <div className="divide-y">
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr_auto] gap-2 items-center px-3 py-2">
                <Input
                  value={item.label}
                  onChange={e => patch(item.id, { label: e.target.value })}
                  placeholder="Allowance name"
                  className="h-9"
                />
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.rate}
                  onChange={e => patch(item.id, { rate: Number(e.target.value) || 0 })}
                  className="h-9"
                />
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={item.units}
                  onChange={e => patch(item.id, { units: Number(e.target.value) || 0 })}
                  className="h-9"
                />
                <Select value={item.unit} onValueChange={v => patch(item.id, { unit: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">per hour</SelectItem>
                    <SelectItem value="day">per day</SelectItem>
                    <SelectItem value="km">per km</SelectItem>
                    <SelectItem value="occurrence">per occurrence</SelectItem>
                    <SelectItem value="shift">per shift</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-right font-medium text-sm tabular-nums">
                  ${(item.rate * item.units).toFixed(2)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(item.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t">
            <Badge variant="secondary" className="text-[11px]">
              {items.length} manual allowance{items.length !== 1 ? 's' : ''}
            </Badge>
            <div className="text-sm font-semibold tabular-nums">
              Total: ${total.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
