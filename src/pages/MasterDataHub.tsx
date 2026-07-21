import { useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Briefcase, IdCard, CalendarDays, Coffee, DollarSign, AlertTriangle } from 'lucide-react';
import { PositionsMasterPanel } from '@/components/settings/masterdata/PositionsMasterPanel';
import { EmploymentTypesMasterPanel } from '@/components/settings/masterdata/EmploymentTypesMasterPanel';

const sections = [
  { id: 'positions', label: 'Positions', icon: Briefcase, ready: true },
  { id: 'employment-types', label: 'Employment types', icon: IdCard, ready: true },
  { id: 'leave-types', label: 'Leave types', icon: CalendarDays, ready: false },
  { id: 'shift-types', label: 'Shift types', icon: Coffee, ready: false },
  { id: 'allowance-types', label: 'Allowance types', icon: DollarSign, ready: false },
  { id: 'exception-reasons', label: 'Exception reasons', icon: AlertTriangle, ready: false },
];

export default function MasterDataHub() {
  const [tab, setTab] = useState('positions');
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 space-y-4 max-w-[1400px]">
        <header className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10"><Database className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Master Data</h1>
            <p className="text-sm text-muted-foreground">Single source of truth for every dropdown used across Workforce, Roster, Timesheets and Awards. Edits are audited; system defaults can be renamed but not deleted.</p>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <TabsTrigger key={s.id} value={s.id} disabled={!s.ready} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {s.label}
                  {!s.ready && <span className="text-[10px] text-muted-foreground ml-1">Soon</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="positions" className="mt-4"><PositionsMasterPanel /></TabsContent>
          <TabsContent value="employment-types" className="mt-4"><EmploymentTypesMasterPanel /></TabsContent>
          {sections.filter(s => !s.ready).map(s => (
            <TabsContent key={s.id} value={s.id} className="mt-4">
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <s.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="font-medium">{s.label}</div>
                <p className="text-xs mt-1">Coming in the next slice.</p>
              </CardContent></Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
