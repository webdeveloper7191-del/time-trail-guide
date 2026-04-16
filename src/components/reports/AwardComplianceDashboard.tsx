import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAwardOverrides, awardComplianceTrend } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Shield, CheckCircle2, AlertTriangle, FileWarning, Target, TrendingUp } from 'lucide-react';

const exportColumns: ExportColumn[] = [
  { header: 'Month', accessor: 'month' }, { header: 'Compliance %', accessor: 'complianceRate' },
  { header: 'Overrides', accessor: 'overrides' }, { header: 'Violations', accessor: 'violations' },
];

const locations = [...new Set(mockAwardOverrides.map(r => r.location))];

export function AwardComplianceDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const latestCompliance = awardComplianceTrend[awardComplianceTrend.length - 1];
  const prevCompliance = awardComplianceTrend[awardComplianceTrend.length - 2];
  const totalOverrides = mockAwardOverrides.length;
  const activeOverrides = mockAwardOverrides.filter(r => !r.expiryDate || new Date(r.expiryDate) > new Date()).length;
  const complianceTrend = latestCompliance.complianceRate - prevCompliance.complianceRate;
  const avgCompliance = (awardComplianceTrend.reduce((s, r) => s + r.complianceRate, 0) / awardComplianceTrend.length).toFixed(1);
  const totalViolations = awardComplianceTrend.reduce((s, r) => s + Math.round(r.violations), 0);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Award Compliance Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={awardComplianceTrend} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Award Compliance Dashboard"
        reportDescription="Monitors adherence to employment awards, tracking compliance rates, active overrides, and violation trends."
        purpose="Ensures all pay rates and conditions meet award requirements, reducing underpayment risk and regulatory exposure."
        whenToUse={[
          'During payroll audits and Fair Work compliance checks', 'After award rate changes to verify system updates',
          'When reviewing override approvals and their justifications', 'For board-level compliance reporting',
        ]}
        keyMetrics={[
          { label: 'Compliance Rate', description: 'Percentage of pay transactions meeting award requirements', interpretation: 'Must maintain 100% for regulatory compliance. Below 95% triggers audit', goodRange: '≥98%', warningRange: '95-97.9%', criticalRange: '<95%' },
          { label: 'Active Overrides', description: 'Currently active rate overrides departing from standard award', interpretation: 'Each override requires documented justification. High counts increase audit risk' },
          { label: 'Violations', description: 'Instances where pay fell below award minimums', interpretation: 'Any violation represents potential underpayment liability. Requires immediate remediation', goodRange: '0', criticalRange: '≥1' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows current compliance rate with trend, active overrides, and violation count. Green = compliant, red = requires action.' },
          { title: 'Compliance Trend', content: 'Area chart shows compliance rate over time. The target line at 98% shows minimum acceptable threshold. Declining trend = systemic issue.' },
          { title: 'Overrides & Violations', content: 'Bar chart tracks monthly override and violation counts. Rising violations despite stable overrides suggests award interpretation errors.' },
        ]}
        actionableInsights={[
          'Any violations require immediate back-pay calculation and remediation',
          'Review all overrides quarterly to ensure ongoing justification',
          'After award rate updates, run compliance checks within 24 hours',
          'Document all override reasons for audit trail compliance',
        ]}
        relatedReports={['Award Override Audit', 'Pay Run Summary', 'Retrospective Pay Adjustments']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Compliance Rate" value={`${latestCompliance.complianceRate.toFixed(1)}%`} icon={Shield} sparklineData={awardComplianceTrend.map(d => d.complianceRate)} trend={{ value: Number(complianceTrend.toFixed(1)), label: 'vs last month' }} variant={latestCompliance.complianceRate >= 98 ? 'success' : 'danger'} size="sm" />
        <StatCard label="Avg Compliance" value={`${avgCompliance}%`} icon={Target} variant={Number(avgCompliance) >= 98 ? 'success' : 'warning'} size="sm" />
        <StatCard label="Active Overrides" value={activeOverrides} icon={FileWarning} size="sm" />
        <StatCard label="Total Overrides" value={totalOverrides} icon={AlertTriangle} size="sm" />
        <StatCard label="Open Violations" value={Math.round(latestCompliance.violations)} icon={CheckCircle2} variant={latestCompliance.violations > 0 ? 'danger' : 'success'} size="sm" />
        <StatCard label="Total Violations" value={totalViolations} icon={TrendingUp} variant={totalViolations > 5 ? 'danger' : 'default'} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {latestCompliance.complianceRate >= 98 && <InsightCard type="positive" title="Strong Compliance" description={`Current compliance rate of ${latestCompliance.complianceRate.toFixed(1)}% exceeds the 98% benchmark.`} />}
        {latestCompliance.violations > 0 && <InsightCard type="negative" title="Active Violations" description={`${Math.round(latestCompliance.violations)} open violations require immediate remediation to prevent underpayment liability.`} action="Calculate and process back-pay immediately" />}
        {activeOverrides > 5 && <InsightCard type="action" title="High Override Count" description={`${activeOverrides} active overrides increase audit complexity. Review for consolidation or expiry.`} action="Quarterly override review recommended" />}
      </div>

      <SummaryRow items={[
        { label: 'Current Rate', value: `${latestCompliance.complianceRate.toFixed(1)}%`, highlight: true },
        { label: 'Trend', value: `${complianceTrend >= 0 ? '+' : ''}${complianceTrend.toFixed(1)}%` },
        { label: 'Overrides', value: activeOverrides }, { label: 'Violations', value: totalViolations },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={awardComplianceTrend.map(d => ({ ...d, target: 98 }))}>
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
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overrides & Violations</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={awardComplianceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="overrides" name="Overrides" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="violations" name="Violations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
