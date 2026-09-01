import { useState } from 'react';
import { CalendarClock, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayCalendar, PayCycle } from '@/types/payroll';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { cycleLabel, periodContaining, recentPeriods } from '@/lib/payroll/payCalendar';
import { toast } from 'sonner';

const blank = (): PayCalendar => ({
  id: `cal-${Date.now().toString(36)}`,
  name: '',
  cycle: 'fortnightly',
  anchorDate: new Date().toISOString().slice(0, 10),
  paymentOffsetDays: 3,
  locationIds: [],
  isDefault: false,
  active: true,
});

export function PayCalendarsPanel() {
  usePayroll();
  const calendars = payrollStore.getCalendars();
  const [draft, setDraft] = useState<PayCalendar | null>(null);

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error('Give the pay calendar a name.');
      return;
    }
    payrollStore.saveCalendar({ ...draft, name: draft.name.trim() });
    toast.success('Pay calendar saved — new pay runs will use these dates.');
    setDraft(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" />Pay calendars</CardTitle>
            <CardDescription>
              Pay periods are generated from an anchor date and cycle. The default calendar pre-fills every new pay run.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDraft(blank())}><Plus className="h-4 w-4 mr-2" />Add calendar</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Current period</TableHead>
                  <TableHead>Payment date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendars.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No pay calendars yet.</TableCell></TableRow>
                )}
                {calendars.map((c) => {
                  const p = periodContaining(c);
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setDraft(c)}>
                      <TableCell className="font-medium">
                        {c.name}
                        {c.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                      </TableCell>
                      <TableCell>{cycleLabel[c.cycle]}</TableCell>
                      <TableCell className="text-sm">{p.periodStart} → {p.periodEnd}</TableCell>
                      <TableCell className="text-sm">{p.paymentDate}</TableCell>
                      <TableCell><Badge variant={c.active ? 'default' : 'outline'}>{c.active ? 'Active' : 'Paused'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Make ${c.name} default`}
                            onClick={(e) => { e.stopPropagation(); payrollStore.saveCalendar({ ...c, isDefault: true }); toast.success(`${c.name} is now the default.`); }}
                          >
                            <Star className={`h-4 w-4 ${c.isDefault ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${c.name}`}
                            onClick={(e) => { e.stopPropagation(); payrollStore.deleteCalendar(c.id); toast.success('Pay calendar removed.'); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {draft && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{calendars.some((c) => c.id === draft.id) ? 'Edit' : 'New'} pay calendar</CardTitle>
            <CardDescription>Periods roll forward automatically from the anchor date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Fortnightly — Melbourne" />
              </div>
              <div className="space-y-2">
                <Label>Cycle</Label>
                <Select value={draft.cycle} onValueChange={(v) => setDraft({ ...draft, cycle: v as PayCycle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anchor date (first day of a period)</Label>
                <Input type="date" value={draft.anchorDate} onChange={(e) => setDraft({ ...draft, anchorDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Payment offset (days after period end)</Label>
                <Input type="number" min={0} value={draft.paymentOffsetDays} onChange={(e) => setDraft({ ...draft, paymentOffsetDays: Number(e.target.value) })} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Switch checked={draft.isDefault} onCheckedChange={(v) => setDraft({ ...draft, isDefault: v })} id="cal-default" />
                <Label htmlFor="cal-default" className="text-sm">Default calendar</Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} id="cal-active" />
                <Label htmlFor="cal-active" className="text-sm">Active</Label>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium mb-2">Upcoming and recent periods</p>
              <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                {recentPeriods(draft, 4).map((p) => (
                  <span key={p.periodStart}>{p.periodStart} → {p.periodEnd} · paid {p.paymentDate}</span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button onClick={save}>Save calendar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
