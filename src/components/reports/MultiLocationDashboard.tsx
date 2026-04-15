import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockLocationOverview } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { MapPin, Users, AlertTriangle, DollarSign, Shield } from 'lucide-react';

export function MultiLocationDashboard() {
  const totalStaff = mockLocationOverview.reduce((s, l) => s + l.activeToday, 0);
  const totalOpenShifts = mockLocationOverview.reduce((s, l) => s + l.openShifts, 0);
  const avgCompliance = Math.round(mockLocationOverview.reduce((s, l) => s + l.complianceScore, 0) / mockLocationOverview.length);
  const totalLabour = mockLocationOverview.reduce((s, l) => s + l.labourCost, 0);

  return (
    <div className="space-y-6">
      {/* Top-level KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><Users className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight">{totalStaff}</p><p className="text-xs text-muted-foreground">Active Today</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight text-destructive">{totalOpenShifts}</p><p className="text-xs text-muted-foreground">Open Shifts</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><Shield className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight">{avgCompliance}%</p><p className="text-xs text-muted-foreground">Avg Compliance</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><DollarSign className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight">${(totalLabour / 1000).toFixed(1)}k</p><p className="text-xs text-muted-foreground">Total Labour Cost</p></div></CardContent></Card>
      </div>

      {/* Location cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {mockLocationOverview.map((loc) => (
          <Card key={loc.locationId} className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">{loc.locationName}</CardTitle>
                </div>
                <Badge variant={loc.complianceScore >= 90 ? 'default' : 'destructive'} className="text-xs">
                  {loc.complianceScore}% compliant
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-lg font-bold">{loc.totalStaff}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
                <div><p className="text-lg font-bold text-emerald-600">{loc.activeToday}</p><p className="text-[10px] text-muted-foreground">Active</p></div>
                <div><p className="text-lg font-bold text-amber-600">{loc.onLeave}</p><p className="text-[10px] text-muted-foreground">Leave</p></div>
                <div><p className="text-lg font-bold text-destructive">{loc.openShifts}</p><p className="text-[10px] text-muted-foreground">Open</p></div>
              </div>

              {/* Utilisation bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Utilisation</span>
                  <span className="font-medium">{loc.utilisationPercent}%</span>
                </div>
                <Progress value={loc.utilisationPercent} className="h-2" />
              </div>

              {/* Budget */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Labour cost</span>
                <span className="font-medium">${loc.labourCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Budget variance</span>
                <span className={cn('font-medium', loc.budgetVariance < 0 ? 'text-emerald-600' : 'text-destructive')}>
                  {loc.budgetVariance < 0 ? '-' : '+'}${Math.abs(loc.budgetVariance)}
                </span>
              </div>

              {/* Area breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <p className="text-xs font-medium text-muted-foreground mb-2">Area Staffing</p>
                {loc.areas.map((area) => (
                  <div key={area.name} className="flex items-center justify-between text-xs">
                    <span>{area.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-medium', !area.compliant && 'text-destructive')}>
                        {area.staffCount}/{area.required}
                      </span>
                      {area.compliant ? (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-200">OK</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-destructive border-destructive/30">GAP</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
