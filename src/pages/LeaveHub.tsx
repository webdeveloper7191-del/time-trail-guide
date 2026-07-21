import { Link } from 'react-router-dom';
import { CalendarCheck, UserCircle, Wallet, ArrowRight } from 'lucide-react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const tiles = [
  {
    title: 'Leave Requests',
    description: 'Review pending requests, approve or reject leave, and create new requests on behalf of staff. Includes RDO, ADO and TOIL leave types.',
    to: '/roster?panel=leave-requests',
    icon: CalendarCheck,
    cta: 'Open Leave Requests',
  },
  {
    title: 'My Leave Balances',
    description: 'Employee-facing view of RDO / ADO / TOIL balances, recent ledger activity, and self-service leave requests.',
    to: '/employee-portal?section=leave-balances',
    icon: UserCircle,
    cta: 'Open Employee Portal',
  },
  {
    title: 'RDO / ADO / TOIL Hub',
    description: 'Configure award and location policies, view the full ledger, and simulate roster tagging.',
    to: '/leave-accruals',
    icon: Wallet,
    cta: 'Open Accruals Hub',
  },
];

export default function LeaveHub() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Leave</h1>
            <p className="text-muted-foreground mt-1">
              Manage staff leave requests, balances, and accrual policies in one place.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.map((t) => (
              <Card key={t.to} className="flex flex-col">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to={t.to}>
                      {t.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
