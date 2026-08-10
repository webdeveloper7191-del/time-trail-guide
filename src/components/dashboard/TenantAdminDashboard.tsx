import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  Building2, Users, DollarSign, ShieldCheck, AlertTriangle, TrendingUp, Handshake, ArrowRight,
} from 'lucide-react';
import { DashboardKpis, SectionHeading } from './DashboardKpis';
import { mockLocationOverview, reportSummaryMetrics } from '@/data/mockReportData';
import { cn } from '@/lib/utils';

export function TenantAdminDashboard() {
  const totalStaff = mockLocationOverview.reduce((s, l) => s + l.totalStaff, 0);
  const openShifts = mockLocationOverview.reduce((s, l) => s + l.openShifts, 0);
  const labourCost = mockLocationOverview.reduce((s, l) => s + l.labourCost, 0);
  const avgCompliance = Math.round(
    mockLocationOverview.reduce((s, l) => s + l.complianceScore, 0) / mockLocationOverview.length,
  );
  const breaches = mockLocationOverview.flatMap((l) => l.areas.filter((a) => !a.compliant)).length;

  return (
    <div className="space-y-6">
      <DashboardKpis
        columns={5}
        items={[
          { label: 'Locations', value: String(mockLocationOverview.length), icon: Building2 },
          { label: 'Total staff', value: String(totalStaff), icon: Users, trend: '+4' },
          { label: 'Labour cost (week)', value: `$${(labourCost / 1000).toFixed(1)}k`, icon: DollarSign, trend: '+1.8%', negative: true },
          { label: 'Compliance score', value: `${avgCompliance}%`, icon: ShieldCheck, trend: '+2%' },
          { label: 'Open shifts', value: String(openShifts), icon: AlertTriangle, trend: '-3' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Location performance</CardTitle>
            <CardDescription className="text-xs">Compliance, utilisation and budget variance across the tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockLocationOverview.map((loc) => (
              <div key={loc.locationId} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{loc.locationName}</span>
                    <Badge variant="outline" className="text-[10px]">{loc.totalStaff} staff</Badge>
                    {loc.openShifts > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{loc.openShifts} open</Badge>
                    )}
                  </div>
                  <span className={cn('text-xs font-medium', loc.budgetVariance > 0 ? 'text-destructive' : 'text-emerald-600')}>
                    {loc.budgetVariance > 0 ? '+' : ''}${loc.budgetVariance} vs budget
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Compliance</span><span>{loc.complianceScore}%</span>
                    </div>
                    <Progress value={loc.complianceScore} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Utilisation</span><span>{loc.utilisationPercent}%</span>
                    </div>
                    <Progress value={loc.utilisationPercent} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Organisation alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { text: `${breaches} ratio breaches across locations`, tone: 'destructive' as const, to: '/reports' },
                { text: `${reportSummaryMetrics.totalOvertimeHours}h overtime above threshold`, tone: 'warning' as const, to: '/reports' },
                { text: `Agency spend $${(reportSummaryMetrics.agencySpend / 1000).toFixed(1)}k this month`, tone: 'default' as const, to: '/settings/agency-partners' },
                { text: '6 qualifications expiring in 30 days', tone: 'warning' as const, to: '/workforce' },
              ].map((a) => (
                <Link key={a.text} to={a.to} className="flex items-center gap-2 rounded-md border border-border/60 p-2.5 hover:bg-muted/50">
                  <span className={cn('h-1.5 w-1.5 rounded-full',
                    a.tone === 'destructive' ? 'bg-destructive' : a.tone === 'warning' ? 'bg-amber-500' : 'bg-muted-foreground')} />
                  <span className="text-xs text-foreground flex-1">{a.text}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Governance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: 'Users & permissions', to: '/settings/permissions', icon: ShieldCheck },
                { label: 'Agency partners', to: '/settings/agency-partners', icon: Handshake },
                { label: 'Master data', to: '/settings/master-data', icon: Building2 },
                { label: 'Reports', to: '/reports', icon: TrendingUp },
              ].map((q) => (
                <Button key={q.label} asChild variant="outline" size="sm" className="justify-start h-9 text-xs">
                  <Link to={q.to}><q.icon className="h-3.5 w-3.5 mr-1.5" />{q.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <SectionHeading title="Where to dig deeper" description="Executive reporting packs available in the Reports module" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {['Payroll cost dashboard', 'Award compliance dashboard', 'Multi-location overview'].map((t) => (
          <Card key={t} className="border-border/60 hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-foreground">{t}</span>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/reports">Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
