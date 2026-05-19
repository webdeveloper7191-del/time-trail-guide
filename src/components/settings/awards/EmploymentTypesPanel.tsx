import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Briefcase, Lock, Info, Award as AwardIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useEmploymentTypes, GLOBAL_AWARD_ID, type EmploymentTypeOption } from '@/lib/employmentTypesStore';
import type { EmploymentType } from '@/types/staff';
import { australianAwards } from '@/data/australianAwards';

const baseTypeOptions: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'casual', label: 'Casual' },
  { value: 'contractor', label: 'Contractor' },
];

export function EmploymentTypesPanel() {
  const [selectedAwardId, setSelectedAwardId] = useState<string>(GLOBAL_AWARD_ID);
  const [types, setTypes] = useEmploymentTypes(selectedAwardId);

  const selectedAward = useMemo(
    () => australianAwards.find(a => a.id === selectedAwardId),
    [selectedAwardId]
  );

  const update = (id: string, patch: Partial<EmploymentTypeOption>) => {
    setTypes(types.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const remove = (id: string) => {
    const t = types.find(x => x.id === id);
    if (!t || t.isSystem) return;
    setTypes(types.filter(x => x.id !== id));
    toast.success(`Removed "${t.name}"`);
  };

  const add = () => {
    const newType: EmploymentTypeOption = {
      id: `cus-${selectedAwardId}-${Date.now()}`,
      name: 'New Employment Type',
      code: 'NEW',
      baseType: 'part_time',
      isSystem: false,
      accruesLeave: true,
      overtimeEligible: true,
    };
    setTypes([...types, newType]);
    toast.success('Custom employment type added');
  };

  const scopeLabel = selectedAwardId === GLOBAL_AWARD_ID
    ? 'Global (default for all awards)'
    : selectedAward?.name ?? 'Unknown award';

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 tracking-tight">
            <Briefcase className="h-5 w-5 text-primary" />
            Employment Types
          </CardTitle>
          <CardDescription className="mt-1.5 max-w-2xl">
            Every FWC award defines its own employment type coverage (casual loading, part-time minimums, apprentices, trainees).
            Pick an award to rename its defaults or add award-specific custom types. The Global list is used when an award has no overrides.
          </CardDescription>
        </div>
        <Button onClick={add} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Add custom type
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <AwardIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Award scope</span>
          </div>
          <Select value={selectedAwardId} onValueChange={setSelectedAwardId}>
            <SelectTrigger className="h-9 w-[360px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cross-award</SelectLabel>
                <SelectItem value={GLOBAL_AWARD_ID}>Global (default for all awards)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Modern awards (FWC)</SelectLabel>
                {australianAwards.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.shortName} — {a.code}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {selectedAward && (
            <Badge variant="outline" className="text-xs">
              Casual loading: {selectedAward.casualLoading}%
            </Badge>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Editing <strong>{scopeLabel}</strong>. System types cannot be deleted, but display name, code, loading,
            leave accrual, and overtime eligibility can all be tuned per award. Custom types added here only apply
            to staff assigned to this award.
          </span>
        </div>

        <div className="rounded-md border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[22%]">Display name</TableHead>
                <TableHead className="w-[10%]">Code</TableHead>
                <TableHead className="w-[16%]">Base type</TableHead>
                <TableHead className="w-[12%]">Loading %</TableHead>
                <TableHead className="w-[12%] text-center">Accrues leave</TableHead>
                <TableHead className="w-[12%] text-center">OT eligible</TableHead>
                <TableHead className="w-[8%]">Source</TableHead>
                <TableHead className="w-[8%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Input
                      value={t.name}
                      onChange={e => update(t.id, { name: e.target.value })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={t.code}
                      onChange={e => update(t.id, { code: e.target.value.toUpperCase() })}
                      className="h-8 font-mono text-xs"
                      maxLength={6}
                    />
                  </TableCell>
                  <TableCell>
                    {t.isSystem ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {baseTypeOptions.find(o => o.value === t.baseType)?.label}
                      </div>
                    ) : (
                      <Select
                        value={t.baseType}
                        onValueChange={(v: EmploymentType) => update(t.id, { baseType: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {baseTypeOptions.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Input
                        type="number"
                        value={t.loadingPercent ?? ''}
                        onChange={e => update(t.id, {
                          loadingPercent: e.target.value === '' ? undefined : Number(e.target.value),
                        })}
                        placeholder="—"
                        className="h-8 pr-6"
                        min={0}
                        max={100}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={t.accruesLeave}
                      onCheckedChange={v => update(t.id, { accruesLeave: v })}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={t.overtimeEligible}
                      onCheckedChange={v => update(t.id, { overtimeEligible: v })}
                    />
                  </TableCell>
                  <TableCell>
                    {t.isSystem ? (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!t.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => toast.success(`Employment types saved for ${scopeLabel}`)}
            size="sm"
          >
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
