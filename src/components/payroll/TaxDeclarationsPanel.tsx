import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { TAX_SCALE_LABELS } from '@/lib/payroll/atoTaxScales';
import { getPayrollStaffDirectory } from '@/lib/payroll/payrollEmployeeBridge';

/**
 * Per-employee tax declarations: the ATO scale to withhold on and whether a
 * study and training support loan (HELP/VET/SFSS) component applies.
 */
export function TaxDeclarationsPanel() {
  usePayroll();
  const [search, setSearch] = useState('');
  const settings = payrollStore.getSettings();
  const staff = getPayrollStaffDirectory();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff
      .filter((s) => !q || `${s.firstName} ${s.lastName} ${s.email ?? ''}`.toLowerCase().includes(q))
      .map((s) => ({
        staff: s,
        profile: payrollStore.getTaxProfile(s.id),
      }));
  }, [staff, search]);

  const update = (staffId: string, patch: { scale?: string; hasStsl?: boolean }) => {
    const existing = payrollStore.getTaxProfile(staffId);
    payrollStore.saveTaxProfile({
      staffId,
      scale: patch.scale ?? existing?.scale ?? settings.defaultAtoScale,
      hasStsl: patch.hasStsl ?? existing?.hasStsl ?? false,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax declarations</CardTitle>
        <CardDescription>
          The withholding scale and loan status from each employee's TFN declaration. Employees without a declaration use
          the default scale ({TAX_SCALE_LABELS[settings.defaultAtoScale as keyof typeof TAX_SCALE_LABELS] ?? settings.defaultAtoScale}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search staff…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>TFN</TableHead>
                <TableHead className="w-80">Tax scale</TableHead>
                <TableHead className="w-40">STSL / HELP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ staff: s, profile }) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.firstName} {s.lastName}
                    <span className="block text-xs text-muted-foreground">{s.email}</span>
                  </TableCell>
                  <TableCell>
                    {s.taxFileNumber
                      ? <Badge variant="secondary">On file</Badge>
                      : <Badge variant="outline">Missing — scale 4</Badge>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={profile?.scale ?? settings.defaultAtoScale}
                      onValueChange={(v) => update(s.id, { scale: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TAX_SCALE_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={Boolean(profile?.hasStsl)}
                      onCheckedChange={(v) => update(s.id, { hasStsl: v })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
