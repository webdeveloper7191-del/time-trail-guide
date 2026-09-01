import { useMemo, useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { DeductionCalc, DeductionCategory, StandingDeduction } from '@/types/payroll';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { getPayrollStaffDirectory } from '@/lib/payroll/payrollEmployeeBridge';
import { toast } from 'sonner';

const categoryLabel: Record<DeductionCategory, string> = {
  pre_tax: 'Pre-tax deduction',
  post_tax: 'Post-tax deduction',
  salary_sacrifice_super: 'Salary sacrifice to super',
  child_support: 'Child support (post-tax)',
  union: 'Union fees (post-tax)',
  other: 'Other (post-tax)',
};

const blank = (): StandingDeduction => ({
  id: crypto.randomUUID(),
  name: '',
  category: 'post_tax',
  calc: 'fixed',
  amount: 0,
  staffIds: [],
  active: true,
});

const currency = (n: number) => `$${n.toFixed(2)}`;

export function DeductionsPanel() {
  usePayroll();
  const deductions = payrollStore.getDeductions();
  const staff = useMemo(() => getPayrollStaffDirectory(), []);
  const [editing, setEditing] = useState<StandingDeduction | null>(null);
  const [search, setSearch] = useState('');

  const patch = (p: Partial<StandingDeduction>) => setEditing((d) => (d ? { ...d, ...p } : d));

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Give the deduction a name.'); return; }
    if (editing.amount <= 0) { toast.error('Enter an amount greater than zero.'); return; }
    payrollStore.saveDeduction(editing);
    toast.success(`${editing.name} saved — applied on the next pay run recalculation.`);
    setEditing(null);
  };

  const filteredStaff = staff.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Deductions & salary sacrifice</CardTitle>
            <CardDescription>
              Recurring amounts taken from every pay run. Pre-tax deductions and salary sacrifice reduce taxable income;
              super guarantee is still calculated on the pre-sacrifice ordinary earnings.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setEditing(blank())}><Plus className="h-4 w-4 mr-2" />Add deduction</Button>
        </CardHeader>
        <CardContent>
          {deductions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No standing deductions yet. Add union fees, novated lease, child support or a salary sacrifice arrangement.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Applies to</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((d) => (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => setEditing({ ...d })}>
                      <TableCell className="font-medium">
                        {d.name}
                        {d.reference && <span className="block text-xs text-muted-foreground">Ref {d.reference}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{categoryLabel[d.category]}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {d.calc === 'fixed' ? currency(d.amount) : `${d.amount}% of gross`}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.staffIds.length ? `${d.staffIds.length} employee(s)` : 'All employees'}
                      </TableCell>
                      <TableCell><Badge variant={d.active ? 'default' : 'outline'}>{d.active ? 'Active' : 'Paused'}</Badge></TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); payrollStore.deleteDeduction(d.id); toast.success('Deduction removed.'); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PrimaryOffCanvas
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.name || 'New deduction'}
        description="Applied to every pay run until paused."
        icon={Wallet}
        size="lg"
        actions={[
          { label: 'Cancel', variant: 'outlined', onClick: () => setEditing(null) },
          { label: 'Save deduction', variant: 'primary', onClick: save },
        ]}
      >
        {editing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editing.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Union fees" />
            </div>
            <div className="space-y-2">
              <Label>Treatment</Label>
              <Select value={editing.category} onValueChange={(v) => patch({ category: v as DeductionCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabel) as DeductionCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>{categoryLabel[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editing.category === 'salary_sacrifice_super'
                  ? 'Reduces taxable income and is reported as RESC. Paid to the employee’s super fund on top of the guarantee.'
                  : editing.category === 'pre_tax'
                    ? 'Taken from gross before PAYG is calculated.'
                    : 'Taken from net pay after PAYG withholding.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calculation</Label>
                <Select value={editing.calc} onValueChange={(v) => patch({ calc: v as DeductionCalc })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed amount per pay</SelectItem>
                    <SelectItem value="percent_gross">Percentage of gross</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{editing.calc === 'fixed' ? 'Amount per pay ($)' : 'Percentage of gross (%)'}</Label>
                <Input type="number" step="0.01" value={editing.amount} onChange={(e) => patch({ amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reference (optional)</Label>
                <Input value={editing.reference ?? ''} onChange={(e) => patch({ reference: e.target.value })} placeholder="Agency or member number" />
              </div>
              <div className="space-y-2">
                <Label>Protected earnings ($)</Label>
                <Input
                  type="number"
                  step="1"
                  value={editing.protectedEarnings ?? ''}
                  onChange={(e) => patch({ protectedEarnings: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 496.80"
                />
                <p className="text-xs text-muted-foreground">Net pay is never reduced below this — the deduction is trimmed instead.</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Pause to stop it applying without deleting the history.</p>
              </div>
              <Switch checked={editing.active} onCheckedChange={(v) => patch({ active: v })} />
            </div>

            <div className="space-y-2">
              <Label>Applies to</Label>
              <p className="text-xs text-muted-foreground">
                Select nobody to apply the deduction to every employee in the run.
              </p>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…" />
              <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
                {filteredStaff.map((s) => {
                  const checked = editing.staffIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-3 p-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          patch({
                            staffIds: v
                              ? [...editing.staffIds, s.id]
                              : editing.staffIds.filter((id) => id !== s.id),
                          })
                        }
                      />
                      <span>{s.firstName} {s.lastName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{s.employeeId}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </PrimaryOffCanvas>
    </>
  );
}
