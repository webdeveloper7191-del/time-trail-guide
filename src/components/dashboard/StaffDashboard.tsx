import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, CalendarCheck, FileText, ArrowRight, Wallet } from 'lucide-react';
import { DashboardKpis } from './DashboardKpis';

const upcomingShifts = [
  { day: 'Tue 11 Aug', time: '7:00 AM - 3:00 PM', area: 'Nursery', location: 'Sunshine Centre', status: 'Confirmed' },
  { day: 'Wed 12 Aug', time: '9:00 AM - 5:00 PM', area: 'Toddler', location: 'Sunshine Centre', status: 'Confirmed' },
  { day: 'Thu 13 Aug', time: '6:30 AM - 2:30 PM', area: 'Preschool', location: 'Harbor View', status: 'Pending' },
];

const leaveBalances = [
  { type: 'Annual leave', balance: 68.5, accruedPct: 72 },
  { type: 'Personal / carer', balance: 24.0, accruedPct: 48 },
  { type: 'TOIL', balance: 6.5, accruedPct: 30 },
  { type: 'RDO / ADO', balance: 1, accruedPct: 25 },
];

export function StaffDashboard() {
  return (
    <div className="space-y-6">
      <DashboardKpis
        columns={4}
        items={[
          { label: 'Hours this week', value: '32.5h', icon: Clock, hint: 'of 38h contracted' },
          { label: 'Upcoming shifts', value: String(upcomingShifts.length), icon: CalendarDays },
          { label: 'Leave balance', value: '68.5h', icon: CalendarCheck, hint: 'Annual leave' },
          { label: 'Est. pay this period', value: '$1,842', icon: Wallet, trend: '+$96' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">My upcoming shifts</CardTitle>
            <CardDescription className="text-xs">Next scheduled work across your assigned locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingShifts.map((s) => (
              <div key={s.day} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <div className="w-24">
                  <p className="text-xs font-medium text-foreground">{s.day}</p>
                  <p className="text-[11px] text-muted-foreground">{s.time}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-foreground">{s.area}</p>
                  <p className="text-[11px] text-muted-foreground">{s.location}</p>
                </div>
                <Badge variant={s.status === 'Confirmed' ? 'secondary' : 'outline'} className="text-[10px]">{s.status}</Badge>
              </div>
            ))}
            <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs mt-1">
              <Link to="/employee-portal">Open my portal<ArrowRight className="h-3 w-3 ml-1.5" /></Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Leave balances</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {leaveBalances.map((l) => (
                <div key={l.type}>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{l.type}</span><span className="text-foreground font-medium">{l.balance}h</span>
                  </div>
                  <Progress value={l.accruedPct} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Quick actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: 'Clock in / out', to: '/employee-portal' },
                { label: 'Submit timesheet', to: '/employee-portal' },
                { label: 'Request leave', to: '/leave' },
                { label: 'My availability', to: '/employee-portal' },
              ].map((q) => (
                <Button key={q.label} asChild variant="outline" size="sm" className="justify-start h-9 text-xs">
                  <Link to={q.to}>{q.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center gap-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-foreground flex-1">2 documents awaiting your signature and 1 timesheet needs resubmission.</span>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs"><Link to="/employee-portal">Review</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
