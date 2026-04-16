import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { mockLocationOverview } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { MapPin, Users, AlertTriangle, DollarSign, Shield, TrendingUp, Activity, Clock, BarChart3, Target } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area, Line,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#F59E0B', '#10B981', '#8B5CF6'];

export function MultiLocationDashboard() {
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const visibleLocations = useMemo(() => {
    if (!drill) return mockLocationOverview;
    if (drill.type === 'location') return mockLocationOverview.filter(l => l.locationName === drill.value);
    if (drill.type === 'status') {
      if (drill.value === 'Active') return mockLocationOverview;
      if (drill.value === 'On Leave') return mockLocationOverview.filter(l => l.onLeave > 0);
      if (drill.value === 'Open Shifts') return mockLocationOverview.filter(l => l.openShifts > 0);
    }
    if (drill.type === 'compliance') {
      if (drill.value === 'Compliant') return mockLocationOverview.filter(l => l.complianceScore >= 90);
      if (drill.value === 'Non-Compliant') return mockLocationOverview.filter(l => l.complianceScore < 90);
    }
    return mockLocationOverview;
  }, [drill]);

  const totalStaff = visibleLocations.reduce((s, l) => s + l.activeToday, 0);
  const totalOpenShifts = visibleLocations.reduce((s, l) => s + l.openShifts, 0);
  const avgCompliance = Math.round(visibleLocations.reduce((s, l) => s + l.complianceScore, 0) / (visibleLocations.length || 1));
  const totalLabour = visibleLocations.reduce((s, l) => s + l.labourCost, 0);
  const totalBudgetVar = visibleLocations.reduce((s, l) => s + l.budgetVariance, 0);
  const avgUtil = Math.round(visibleLocations.reduce((s, l) => s + l.utilisationPercent, 0) / (visibleLocations.length || 1));
  const totalOnLeave = visibleLocations.reduce((s, l) => s + l.onLeave, 0);
  const totalHeadcount = visibleLocations.reduce((s, l) => s + l.totalStaff, 0);
  const staffingRate = totalHeadcount > 0 ? Math.round((totalStaff / totalHeadcount) * 100) : 0;

  const complianceTrend = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => ({
    month: m, compliance: 85 + i * 1.8 + Math.round(Math.random() * 3),
    utilisation: 75 + i * 2 + Math.round(Math.random() * 4), target: 95,
  }));

  const radarData = visibleLocations.map(loc => ({
    location: loc.locationName.split(' ')[0], compliance: loc.complianceScore,
    utilisation: loc.utilisationPercent, staffing: Math.round((loc.activeToday / loc.totalStaff) * 100),
    budget: Math.max(0, 100 - Math.abs(loc.budgetVariance) / 100),
  }));

  const costByLocation = visibleLocations.map(loc => ({
    name: loc.locationName.split(' ')[0], fullName: loc.locationName,
    labour: loc.labourCost, variance: loc.budgetVariance, openShiftCost: loc.openShifts * 280,
  }));

  const allAreas = visibleLocations.flatMap(loc => loc.areas.map(a => ({ ...a, location: loc.locationName })));
  const compliantAreas = allAreas.filter(a => a.compliant).length;
  const totalAreas = allAreas.length;
  const gapAreas = allAreas.filter(a => !a.compliant);

  const staffingPie = [
    { name: 'Active', value: totalStaff },
    { name: 'On Leave', value: totalOnLeave },
    { name: 'Open Shifts', value: totalOpenShifts },
  ];

  const worstLocation = visibleLocations.length ? visibleLocations.reduce((a, b) => a.complianceScore < b.complianceScore ? a : b) : null;
  const bestLocation = visibleLocations.length ? visibleLocations.reduce((a, b) => a.complianceScore > b.complianceScore ? a : b) : null;

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  const handlePieClick = (_: any, index: number) => {
    const item = staffingPie[index];
    if (item) setDrill({ type: 'status', value: item.name, label: 'Status' });
  };

  const handleRadarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.location) {
      const locName = mockLocationOverview.find(l => l.locationName.startsWith(data.activePayload[0].payload.location))?.locationName;
      if (locName) setDrill({ type: 'location', value: locName, label: 'Location' });
    }
  };

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Multi-Location Overview"
        reportDescription="Comprehensive cross-site operational view showing staffing, compliance, utilisation, and budget status for all managed locations."
        purpose="Provides executives and regional managers with a single-pane view of operational health across all locations, enabling rapid identification of sites needing attention."
        whenToUse={['During daily morning huddles', 'Board reports on multi-site performance', 'Identifying compliance gaps or budget overruns', 'Strategic cross-site resource allocation']}
        keyMetrics={[
          { label: 'Compliance Score', description: 'Average percentage of areas meeting requirements', interpretation: 'Below 90% indicates systemic issues', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
          { label: 'Utilisation Rate', description: 'Proportion of staff capacity being used', interpretation: 'Target 85-95%', goodRange: '85-95%', warningRange: '75-84%', criticalRange: '<75% or >95%' },
          { label: 'Open Shifts', description: 'Total unfilled shifts', interpretation: 'Each represents coverage risk', goodRange: '0-2', warningRange: '3-5', criticalRange: '>5' },
          { label: 'Budget Variance', description: 'Planned vs actual labour costs', interpretation: 'Negative = under budget (good)' },
        ]}
        howToRead={[
          { title: 'Interactive Charts', content: 'Click any bar, pie slice, or radar point to drill into that specific location or category. A filter badge appears showing your selection — click ✕ to clear.' },
          { title: 'KPI Cards', content: 'Top row shows aggregates that update based on your drill-down selection.' },
          { title: 'Location Cards', content: 'Bottom section shows per-site detail with area-level compliance badges.' },
        ]}
        actionableInsights={['Focus on locations below 90% compliance', 'Compare utilisation to identify staff sharing opportunities', 'Open shifts >5 indicate systematic scheduling issues']}
        relatedReports={['Multi-Site Operations', 'Cross-Location Deployment', 'Staffing Ratio Compliance']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total Staff" value={totalHeadcount} icon={Users} size="sm" sparklineData={[38, 40, 39, 42, 42]} />
        <StatCard label="Active Today" value={totalStaff} icon={Activity} size="sm" variant={staffingRate < 80 ? 'warning' : 'success'} />
        <StatCard label="On Leave" value={totalOnLeave} icon={Clock} size="sm" />
        <StatCard label="Open Shifts" value={totalOpenShifts} icon={AlertTriangle} size="sm" variant={totalOpenShifts > 5 ? 'danger' : totalOpenShifts > 2 ? 'warning' : 'default'} />
        <StatCard label="Avg Compliance" value={`${avgCompliance}%`} icon={Shield} size="sm" variant={avgCompliance >= 95 ? 'success' : avgCompliance >= 90 ? 'warning' : 'danger'} sparklineData={complianceTrend.map(d => d.compliance)} />
        <StatCard label="Avg Utilisation" value={`${avgUtil}%`} icon={BarChart3} size="sm" variant={avgUtil >= 85 ? 'success' : 'warning'} sparklineData={complianceTrend.map(d => d.utilisation)} />
        <StatCard label="Labour Cost" value={`$${(totalLabour / 1000).toFixed(1)}k`} icon={DollarSign} size="sm" />
        <StatCard label="Budget Var" value={`${totalBudgetVar >= 0 ? '+' : ''}$${Math.abs(totalBudgetVar)}`} icon={Target} size="sm" variant={totalBudgetVar > 500 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {worstLocation && worstLocation.complianceScore < 90 && (
          <InsightCard type="negative" title={`${worstLocation.locationName} Below Threshold`} description={`Compliance at ${worstLocation.complianceScore}%. ${gapAreas.filter(a => a.location === worstLocation.locationName).length} area(s) have gaps.`} action="Review area staffing and deploy cross-site staff" />
        )}
        {totalOpenShifts > 5 && <InsightCard type="action" title="High Open Shift Count" description={`${totalOpenShifts} open shifts. Est. cost: $${(totalOpenShifts * 280).toLocaleString()}`} action="Trigger agency broadcast or auto-fill" />}
        {bestLocation && bestLocation.complianceScore >= 95 && <InsightCard type="positive" title={`${bestLocation.locationName} Leading`} description={`Top performer with ${bestLocation.complianceScore}% compliance.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Locations', value: visibleLocations.length }, { label: 'Areas', value: totalAreas },
        { label: 'Compliant', value: `${compliantAreas}/${totalAreas}`, highlight: true },
        { label: 'Staffing Rate', value: `${staffingRate}%` }, { label: 'Gaps', value: gapAreas.length },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Location Performance Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} onClick={handleRadarClick}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="location" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Compliance" dataKey="compliance" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Utilisation" dataKey="utilisation" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                <Radar name="Staffing" dataKey="staffing" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance & Utilisation Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={complianceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="compliance" name="Compliance %" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="utilisation" name="Utilisation %" stroke="#10B981" fill="#10B981" fillOpacity={0.08} strokeWidth={2} />
                <Line type="monotone" dataKey="target" name="Target" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Staffing Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={staffingPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" onClick={handlePieClick} style={{ cursor: 'pointer' }}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {staffingPie.map((_, i) => <Cell key={i} fill={['#10B981', '#F59E0B', 'hsl(var(--destructive))'][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-[10px] text-muted-foreground mt-1">
              {staffingPie.map((s, i) => (
                <span key={s.name} className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => setDrill({ type: 'status', value: s.name, label: 'Status' })}>
                  <span className="w-2 h-2 rounded-full" style={{ background: ['#10B981', '#F59E0B', 'hsl(var(--destructive))'][i] }} />
                  {s.name}: {s.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Labour Cost & Open Shift Exposure by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costByLocation} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="labour" name="Labour Cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              <Bar dataKey="openShiftCost" name="Open Shift Exposure" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {visibleLocations.map((loc) => {
          const locGaps = loc.areas.filter(a => !a.compliant);
          const locStaffRate = Math.round((loc.activeToday / loc.totalStaff) * 100);
          return (
            <Card key={loc.locationId} className={cn('border-border/60 cursor-pointer hover:border-primary/40 transition-colors', loc.complianceScore < 85 && 'border-destructive/40')}
              onClick={() => setDrill(drill?.value === loc.locationName ? null : { type: 'location', value: loc.locationName, label: 'Location' })}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">{loc.locationName}</CardTitle>
                  </div>
                  <Badge variant={loc.complianceScore >= 90 ? 'default' : 'destructive'} className="text-xs">{loc.complianceScore}% compliant</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><p className="text-lg font-bold">{loc.totalStaff}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
                  <div><p className="text-lg font-bold text-emerald-600">{loc.activeToday}</p><p className="text-[10px] text-muted-foreground">Active</p></div>
                  <div><p className="text-lg font-bold text-amber-600">{loc.onLeave}</p><p className="text-[10px] text-muted-foreground">Leave</p></div>
                  <div><p className="text-lg font-bold text-destructive">{loc.openShifts}</p><p className="text-[10px] text-muted-foreground">Open</p></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Utilisation</span><span className={cn('font-medium', loc.utilisationPercent > 95 ? 'text-destructive' : '')}>{loc.utilisationPercent}%</span></div>
                  <Progress value={loc.utilisationPercent} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Staffing Rate</span><span className={cn('font-medium', locStaffRate < 80 ? 'text-destructive' : '')}>{locStaffRate}%</span></div>
                  <Progress value={locStaffRate} className="h-2" />
                </div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Labour cost</span><span className="font-medium">${loc.labourCost.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Budget variance</span><span className={cn('font-medium', loc.budgetVariance < 0 ? 'text-emerald-600' : 'text-destructive')}>{loc.budgetVariance < 0 ? '-' : '+'}${Math.abs(loc.budgetVariance)}</span></div>
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Area Staffing ({loc.areas.length} areas · {locGaps.length} gaps)</p>
                  {loc.areas.map((area) => (
                    <div key={area.name} className="flex items-center justify-between text-xs">
                      <span>{area.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-medium', !area.compliant && 'text-destructive')}>{area.staffCount}/{area.required}</span>
                        {area.compliant ? <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-200">OK</Badge> : <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-destructive border-destructive/30">GAP</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
