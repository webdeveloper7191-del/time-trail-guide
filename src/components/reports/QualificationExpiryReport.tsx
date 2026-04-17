import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockQualificationData, QualificationRecord } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { format, parseISO } from 'date-fns';
import { Shield, AlertTriangle, CheckCircle2, Clock, FileWarning, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const statusColors: Record<string, string> = { valid: 'bg-emerald-100 text-emerald-800', expiring_soon: 'bg-amber-100 text-amber-800', expired: 'bg-destructive/10 text-destructive' };
const statusLabels: Record<string, string> = { valid: 'Valid', expiring_soon: 'Expiring Soon', expired: 'Expired' };
const COLORS = ['hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)', 'hsl(var(--destructive))'];

const locations = [...new Set(mockQualificationData.map(r => r.location))];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Qualification', accessor: 'qualification' },
  { header: 'Expiry', accessor: (r: any) => format(parseISO(r.expiryDate), 'dd MMM yyyy') },
  { header: 'Days', accessor: 'daysUntilExpiry' }, { header: 'Status', accessor: (r: any) => statusLabels[r.status] },
];

const tableColumns: DataTableColumn<QualificationRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'number', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'qualification', header: 'Qualification', accessor: (r) => <span className="text-xs">{r.qualification}</span>, sortValue: (r) => r.qualification },
  { key: 'issueDate', header: 'Issued', type: 'date', accessor: (r) => <span className="text-xs text-muted-foreground">{format(parseISO(r.issueDate), 'dd MMM yy')}</span>, sortValue: (r) => r.issueDate },
  { key: 'expiryDate', header: 'Expires', type: 'date', accessor: (r) => <span className="text-xs">{format(parseISO(r.expiryDate), 'dd MMM yyyy')}</span>, sortValue: (r) => r.expiryDate },
  { key: 'daysUntilExpiry', header: 'Days Left', type: 'date', align: 'right', sortValue: (r) => r.daysUntilExpiry,
    accessor: (r) => <span className={cn('text-xs font-semibold', r.daysUntilExpiry < 0 ? 'text-destructive' : r.daysUntilExpiry < 90 ? 'text-amber-600' : 'text-emerald-600')}>{r.daysUntilExpiry < 0 ? `${Math.abs(r.daysUntilExpiry)}d overdue` : `${r.daysUntilExpiry}d`}</span> },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge className={`text-[10px] ${statusColors[r.status]}`}>{statusLabels[r.status]}</Badge> },
];

export function QualificationExpiryReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    return filterByDateRange(mockQualificationData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase()) && !r.qualification.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), dateRange);
  }, [search, location]);

  const { drill, drilled: filtered, applyDrill, clearDrill, animKey } = useDrillFilter(
    baseFiltered,
    (item: any, d: DrillFilter) => {
      if (d.type === 'location' && 'location' in item) return item.location === d.value;
      if (d.type === 'department' && 'department' in item) return item.department === d.value;
      if (d.type === 'category' && 'category' in item) return item.category === d.value;
      if (d.type === 'status' && 'status' in item) return item.status === d.value;
      if (d.type === 'type' && 'type' in item) return item.type === d.value;
      if (d.type === 'severity' && 'gapSeverity' in item) return item.gapSeverity === d.value;
      if (d.type === 'staffName' && 'staffName' in item) return item.staffName === d.value;
      if (d.type === 'agencyName' && 'agencyName' in item) return item.agencyName === d.value;
      if (d.type === 'adjustmentType' && 'adjustmentType' in item) return item.adjustmentType === d.value;
      if (d.type === 'areaName' && 'areaName' in item) return item.areaName === d.value;
      if (d.type === 'sourceLocation' && 'sourceLocation' in item) return item.sourceLocation === d.value;
      return String((item as any)[d.type]) === d.value;
    }
  );


  const validCount = filtered.filter(r => r.status === 'valid').length;
  const expiringCount = filtered.filter(r => r.status === 'expiring_soon').length;
  const expiredCount = filtered.filter(r => r.status === 'expired').length;
  const complianceRate = filtered.length ? Math.round((validCount / filtered.length) * 100) : 0;
  const uniqueStaff = [...new Set(filtered.map(r => r.staffName))].length;
  const uniqueQuals = [...new Set(filtered.map(r => r.qualification))].length;

  const statusPie = [
    { name: 'Valid', value: validCount }, { name: 'Expiring Soon', value: expiringCount }, { name: 'Expired', value: expiredCount },
  ];

  const qualCoverage = useMemo(() => {
    const map: Record<string, { valid: number; expiring: number; expired: number }> = {};
    filtered.forEach(r => {
      if (!map[r.qualification]) map[r.qualification] = { valid: 0, expiring: 0, expired: 0 };
      if (r.status === 'valid') map[r.qualification].valid++;
      else if (r.status === 'expiring_soon') map[r.qualification].expiring++;
      else map[r.qualification].expired++;
    });
    return Object.entries(map).map(([name, counts]) => ({ name, ...counts }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Qualification & Certification Expiry" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff or qualifications..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Qualification & Certification Expiry Report"
        reportDescription="Monitors the validity and expiry status of all staff qualifications and certifications to ensure continuous compliance with regulatory requirements."
        purpose="Prevents operational disruption and compliance violations by providing early warning of expiring or expired staff certifications."
        whenToUse={[
          'Weekly compliance review to catch upcoming expiries', 'During regulatory audits requiring proof of valid certifications',
          'When planning staff training and renewal schedules', 'Before rostering staff to ensure qualification compliance',
        ]}
        keyMetrics={[
          { label: 'Compliance Rate', description: 'Percentage of qualifications currently valid', interpretation: 'Must be maintained at 100% for regulated roles. Below 90% is a compliance emergency', goodRange: '100%', warningRange: '90-99%', criticalRange: '<90%' },
          { label: 'Expiring Soon', description: 'Qualifications due to expire within 90 days', interpretation: 'Each requires proactive renewal action. Plan renewals at least 30 days before expiry' },
          { label: 'Expired', description: 'Qualifications past their expiry date', interpretation: 'Staff with expired mandatory quals should be restricted from affected duties immediately', goodRange: '0', criticalRange: '≥1' },
        ]}
        howToRead={[
          { title: 'Compliance KPIs', content: 'Top cards show compliance rate, expiring/expired counts, and coverage breadth. Red variants indicate items requiring immediate action.' },
          { title: 'Status Pie Chart', content: 'Proportional view of valid vs expiring vs expired. Any visible red slice requires urgent attention.' },
          { title: 'Qualification Coverage', content: 'Stacked bar chart showing the health of each qualification type. Fully green bars = fully compliant qualification type.' },
          { title: 'Detail Table', content: 'Sort by "Days Left" to prioritise renewals. Negative days = overdue. Colour coding: green (>90d), amber (1-90d), red (overdue).' },
        ]}
        actionableInsights={[
          'Immediately notify staff with expired qualifications and restrict from affected duties',
          'Send renewal reminders to all "Expiring Soon" staff and their managers',
          'Schedule group training sessions for qualifications with multiple upcoming expiries',
          'Update the roster compliance engine to block scheduling of staff with expired mandatory quals',
        ]}
        relatedReports={['Skills Matrix', 'Staffing Ratio Compliance', 'Compliance Violation Summary']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Compliance Rate" value={`${complianceRate}%`} icon={Shield} variant={complianceRate === 100 ? 'success' : complianceRate >= 90 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="Valid" value={validCount} icon={CheckCircle2} variant="success" size="sm" />
        <StatCard label="Expiring Soon" value={expiringCount} icon={Clock} variant={expiringCount > 0 ? 'warning' : 'default'} size="sm" />
        <StatCard label="Expired" value={expiredCount} icon={AlertTriangle} variant={expiredCount > 0 ? 'danger' : 'success'} size="sm" />
        <StatCard label="Staff Covered" value={uniqueStaff} icon={Award} size="sm" />
        <StatCard label="Qualification Types" value={uniqueQuals} icon={FileWarning} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {expiredCount > 0 && <InsightCard type="negative" title={`${expiredCount} Expired Qualification${expiredCount > 1 ? 's' : ''}`} description="Staff with expired qualifications may be non-compliant for regulated duties. Immediate action required." action="Restrict affected staff and initiate renewal" />}
        {expiringCount > 0 && <InsightCard type="action" title={`${expiringCount} Expiring Within 90 Days`} description="These qualifications need proactive renewal to prevent gaps in compliance coverage." action="Send renewal reminders to affected staff" />}
        {complianceRate === 100 && <InsightCard type="positive" title="Full Compliance" description="All staff qualifications are current. No expired or overdue certifications detected." />}
      </div>

      <SummaryRow items={[
        { label: 'Total Quals', value: filtered.length }, { label: 'Valid', value: validCount, highlight: true },
        { label: 'Expiring', value: expiringCount }, { label: 'Expired', value: expiredCount },
        { label: 'Compliance', value: `${complianceRate}%`, highlight: true },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Coverage by Qualification</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={qualCoverage} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="valid" stackId="a" fill="hsl(142, 76%, 36%)" name="Valid" />
                <Bar dataKey="expiring" stackId="a" fill="hsl(45, 93%, 47%)" name="Expiring" />
                <Bar dataKey="expired" stackId="a" fill="hsl(var(--destructive))" name="Expired" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">All Qualifications</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
