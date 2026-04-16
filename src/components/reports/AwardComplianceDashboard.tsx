import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAwardOverrides, awardComplianceTrend } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Shield, CheckCircle2, AlertTriangle, FileWarning, Target, TrendingUp } from 'lucide-react';
import { filterByDateRange } from '@/lib/reportDateFilter';

const exportColumns: ExportColumn[] = [
  { header: 'Month', accessor: 'month' }, { header: 'Compliance %', accessor: 'complianceRate' },
  { header: 'Overrides', accessor: 'overrides' }, { header: 'Violations', accessor: 'violations' },
];
const locations = [...new Set(mockAwardOverrides.map(r => r.location))];

export function AwardComplianceDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const filteredTrend = useMemo(() => {
    if (!drill || drill.type !== 'month') return awardComplianceTrend;
    return awardComplianceTrend.filter(d => d.month === drill.value);
  }, [drill]);

  const filteredOverrides = useMemo(() => {
    let data = mockAwardOverrides;
    if (locationFilter !== 'all') data = data.filter(r => r.location === locationFilter);
    if (search) data = data.filter(r => r.staffName.toLowerCase().includes(search.toLowerCase()));
    if (drill?.type === 'location') data = data.filter(r => r.location === drill.value);
    return data;
  }, [search, locationFilter, drill]);

  const latestCompliance = awardComplianceTrend[awardComplianceTrend.length - 1];
  const prevCompliance = awardComplianceTrend[awardComplianceTrend.length - 2];
  const totalOverrides = filteredOverrides.length;
  const activeOverrides = filteredOverrides.filter(r => !r.expiryDate || new Date(r.expiryDate) > new Date()).length;
  const complianceTrend = latestCompliance.complianceRate - prevCompliance.complianceRate;
  const avgCompliance = (awardComplianceTrend.reduce((s, r) => s + r.complianceRate, 0) / awardComplianceTrend.length).toFixed(1);
  const totalViolations = awardComplianceTrend.reduce((s, r) => s + Math.round(r.violations), 0);

  const handleTrendClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.month) {
      setDrill({ type: 'month', value: data.activePayload[0].payload.month, label: 'Month' });
    }
  };

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.month) {
      setDrill({ type: 'month', value: data.activePayload[0].payload.month, label: 'Month' });
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Award Compliance Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={awardComplianceTrend} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide reportName="Award Compliance Dashboard" reportDescription="Award adherence monitoring with drill-through to specific months and locations."
        purpose="Track compliance rates and violations. Click chart elements to drill into specific time periods."
        whenToUse={['Payroll audits', 'After award rate changes', 'Board compliance reporting']}
        keyMetrics={[
          { label: 'Compliance Rate', description: '% of pay meeting award requirements', interpretation: 'Must maintain ≥98%', goodRange: '≥98%', warningRange: '95-97.9%', criticalRange: '<95%' },
          { label: 'Violations', description: 'Pay below award minimums', interpretation: 'Any violation = underpayment liability', goodRange: '0', criticalRange: '≥1' },
        ]}
        howToRead={[{ title: 'Drill-Through', content: 'Click on trend chart or bar chart data points to filter to a specific month. Override counts update based on your selection.' }]}
        actionableInsights={['Violations require immediate back-pay', 'Review overrides quarterly']}
        relatedReports={['Award Override Audit', 'Pay Run Summary', 'Retrospective Pay']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Compliance Rate" value={`${latestCompliance.complianceRate.toFixed(1)}%`} icon={Shield} sparklineData={awardComplianceTrend.map(d => d.complianceRate)} trend={{ value: Number(complianceTrend.toFixed(1)), label: 'vs last month' }} variant={latestCompliance.complianceRate >= 98 ? 'success' : 'danger'} size="sm" />
        <StatCard label="Avg Compliance" value={`${avgCompliance}%`} icon={Target} variant={Number(avgCompliance) >= 98 ? 'success' : 'warning'} size="sm" />
        <StatCard label="Active Overrides" value={activeOverrides} icon={FileWarning} size="sm" />
        <StatCard label="Total Overrides" value={totalOverrides} icon={AlertTriangle} size="sm" />
        <StatCard label="Open Violations" value={Math.round(latestCompliance.violations)} icon={CheckCircle2} variant={latestCompliance.violations > 0 ? 'danger' : 'success'} size="sm" />
        <StatCard label="Total Violations" value={totalViolations} icon={TrendingUp} variant={totalViolations > 5 ? 'danger' : 'default'} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {latestCompliance.complianceRate >= 98 && <InsightCard type="positive" title="Strong Compliance" description={`${latestCompliance.complianceRate.toFixed(1)}% exceeds 98% benchmark.`} />}
        {latestCompliance.violations > 0 && <InsightCard type="negative" title="Active Violations" description={`${Math.round(latestCompliance.violations)} open violations.`} action="Process back-pay immediately" />}
        {activeOverrides > 5 && <InsightCard type="action" title="High Overrides" description={`${activeOverrides} active.`} action="Quarterly review recommended" />}
      </div>

      <SummaryRow items={[
        { label: 'Rate', value: `${latestCompliance.complianceRate.toFixed(1)}%`, highlight: true },
        { label: 'Trend', value: `${complianceTrend >= 0 ? '+' : ''}${complianceTrend.toFixed(1)}%` },
        { label: 'Overrides', value: activeOverrides }, { label: 'Violations', value: totalViolations },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance Trend <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={awardComplianceTrend.map(d => ({ ...d, target: 98 }))} onClick={handleTrendClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="complianceRate" name="Compliance %" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                <Line type="monotone" dataKey="target" name="Target" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overrides & Violations <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={awardComplianceTrend} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="overrides" name="Overrides" fill="#F59E0B" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
                <Bar dataKey="violations" name="Violations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
