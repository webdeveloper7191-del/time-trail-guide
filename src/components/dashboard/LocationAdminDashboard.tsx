import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Users, CalendarClock, AlertTriangle, CheckSquare, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { DashboardKpis } from './DashboardKpis';
import { mockLocationOverview } from '@/data/mockReportData';
import { cn } from '@/lib/utils';

export function LocationAdminDashboard() {
  const [locationId, setLocationId] = useState(mockLocationOverview[0].locationId);
  const loc = mockLocationOverview.find((l) => l.locationId === locationId) ?? mockLocationOverview[0];
  const breaches = loc.areas.filter((a) => !a.compliant);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Location</span>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="h-9 w-56 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {mockLocationOverview.map((l) => (
              <SelectItem key={l.locationId} value={l.locationId}>{l.locationName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DashboardKpis
        columns={5}
        items={[
          { label: 'On shift today', value: `${loc.activeToday}/${loc.totalStaff}`, icon: Users },
          { label: 'Open shifts', value: String(loc.openShifts), icon: CalendarClock, trend: '-1' },
          { label: 'On leave', value: String(loc.onLeave), icon: Clock },
          { label: 'Ratio breaches', value: String(breaches.length), icon: AlertTriangle, negative: breaches.length > 0, trend: breaches.length ? 'action needed' : 'clear' },
          { label: 'Labour cost (week)', value: `$${(loc.labourCost / 1000).toFixed(1)}k`, icon: DollarSign, trend: `${loc.budgetVariance > 0 ? '+' : ''}$${loc.budgetVariance}`, negative: loc.budgetVariance > 0 },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Area coverage right now</CardTitle>
            <CardDescription className="text-xs">Scheduled staff against required staffing for {loc.locationName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loc.areas.map((a) => (
              <div key={a.name} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <span className="text-sm font-medium text-foreground w-28">{a.name}</span>
                <div className="flex-1">
                  <Progress value={Math.min(100, (a.staffCount / Math.max(1, a.required)) * 100)} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right">{a.staffCount} / {a.required}</span>
                <Badge variant={a.compliant ? 'secondary' : 'destructive'} className="text-[10px] w-20 justify-center">
                  {a.compliant ? 'Compliant' : 'Understaffed'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-sm">My approvals</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Timesheets awaiting approval', count: 12, to: '/timesheet-admin' },
                { label: 'Leave requests pending', count: 4, to: '/leave' },
                { label: 'Shift swap requests', count: 2, to: '/roster' },
                { label: 'Timesheet exceptions', count: 3, to: '/timesheet-admin' },
              ].map((t) => (
                <Link key={t.label} to={t.to} className="flex items-center gap-2 rounded-md border border-border/60 p-2.5 hover:bg-muted/50">
                  <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground flex-1">{t.label}</span>
                  <Badge variant="secondary" className="text-[10px]">{t.count}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Quick actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: 'Open roster', to: '/roster' },
                { label: 'Fill open shifts', to: '/roster' },
                { label: 'Add timesheet', to: '/timesheet-admin' },
                { label: 'Location settings', to: '/locations' },
              ].map((q) => (
                <Button key={q.label} asChild variant="outline" size="sm" className="justify-start h-9 text-xs">
                  <Link to={q.to}>{q.label}<ArrowRight className="h-3 w-3 ml-auto" /></Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {breaches.length > 0 && (
        <Card className={cn('border-destructive/40 bg-destructive/5')}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-foreground flex-1">
              {breaches.map((b) => b.name).join(', ')} below required staffing — raise an open shift or reassign staff.
            </span>
            <Button asChild size="sm" className="h-8 text-xs"><Link to="/roster">Resolve in roster</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
