import { useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Database, Briefcase, IdCard, CalendarDays, Coffee, DollarSign, AlertTriangle } from 'lucide-react';
import { PositionsMasterPanel } from '@/components/settings/masterdata/PositionsMasterPanel';
import { EmploymentTypesMasterPanel } from '@/components/settings/masterdata/EmploymentTypesMasterPanel';
import { LeaveTypesMasterPanel } from '@/components/settings/masterdata/LeaveTypesMasterPanel';
import { ShiftTypesMasterPanel } from '@/components/settings/masterdata/ShiftTypesMasterPanel';
import { AllowanceTypesMasterPanel } from '@/components/settings/masterdata/AllowanceTypesMasterPanel';
import { ExceptionReasonsMasterPanel } from '@/components/settings/masterdata/ExceptionReasonsMasterPanel';

const sections = [
  { id: 'positions',          label: 'Positions',          icon: Briefcase,     Comp: PositionsMasterPanel },
  { id: 'employment-types',   label: 'Employment types',   icon: IdCard,        Comp: EmploymentTypesMasterPanel },
  { id: 'leave-types',        label: 'Leave types',        icon: CalendarDays,  Comp: LeaveTypesMasterPanel },
  { id: 'shift-types',        label: 'Shift types',        icon: Coffee,        Comp: ShiftTypesMasterPanel },
  { id: 'allowance-types',    label: 'Allowance types',    icon: DollarSign,    Comp: AllowanceTypesMasterPanel },
  { id: 'exception-reasons',  label: 'Exception reasons',  icon: AlertTriangle, Comp: ExceptionReasonsMasterPanel },
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
                <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {s.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {sections.map(s => (
            <TabsContent key={s.id} value={s.id} className="mt-4">
              <s.Comp />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
