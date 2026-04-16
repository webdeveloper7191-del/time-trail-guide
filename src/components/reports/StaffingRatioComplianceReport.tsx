import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockStaffingRatios, StaffingRatioRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Users, AlertTriangle, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';


const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Required Ratio', accessor: 'requiredRatio' }, { header: 'Actual Ratio', accessor: 'actualRatio' },
  { header: 'Attendance', accessor: 'attendance' }, { header: 'Required Staff', accessor: 'requiredStaff' },
  { header: 'Actual Staff', accessor: 'actualStaff' }, { header: 'Compliant', accessor: 'isCompliant' },
];

const locations = [...new Set(mockStaffingRatios.map(r => r.locationName))];

const tableColumns: DataTableColumn<StaffingRatioRecord>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'timeSlot', header: 'Time', accessor: (r) => r.timeSlot, sortValue: (r) => r.timeSlot },
  { key: 'serviceCategory', header: 'Category', accessor: (r) => <Badge variant="outline" className="text-xs">{r.serviceCategory}</Badge>, sortValue: (r) => r.serviceCategory },
  { key: 'attendance', header: 'Attendance', accessor: (r) => r.attendance, sortValue: (r) => r.attendance, align: 'right' },
  { key: 'requiredRatio', header: 'Req. Ratio', accessor: (r) => r.requiredRatio, sortValue: (r) => r.requiredRatio },
  { key: 'actualRatio', header: 'Act. Ratio', sortValue: (r) => r.actualRatio,
    accessor: (r) => <span className={cn('font-medium', r.isCompliant ? 'text-emerald-600' : 'text-destructive')}>{r.actualRatio}</span> },
  { key: 'requiredStaff', header: 'Req. Staff', accessor: (r) => r.requiredStaff, sortValue: (r) => r.requiredStaff, align: 'right' },
  { key: 'actualStaff', header: 'Act. Staff', accessor: (r) => r.actualStaff, sortValue: (r) => r.actualStaff, align: 'right' },
  { key: 'isCompliant', header: 'Status', align: 'center', sortValue: (r) => r.isCompliant ? 1 : 0,
    accessor: (r) => r.isCompliant ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" /> },
];

export function StaffingRatioComplianceReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => mockStaffingRatios.filter(r => {
    const matchesSearch = !search || r.areaName.toLowerCase().includes(search.toLowerCase()) || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

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


  const complianceRate = Math.round(filtered.filter(r => r.isCompliant).length / (filtered.length || 1) * 100);
  const breachCount = filtered.filter(r => !r.isCompliant).length;
  const compliantCount = filtered.filter(r => r.isCompliant).length;
  const totalAttendance = filtered.reduce((s, r) => s + r.attendance, 0);
  const totalRequiredStaff = filtered.reduce((s, r) => s + r.requiredStaff, 0);
  const totalActualStaff = filtered.reduce((s, r) => s + r.actualStaff, 0);
  const staffSurplus = totalActualStaff - totalRequiredStaff;

  // Categories
  const categories = [...new Set(filtered.map(r => r.serviceCategory))];
  const byCategoryCompliance = categories.map(cat => {
    const items = filtered.filter(r => r.serviceCategory === cat);
    return { name: cat, compliant: items.filter(r => r.isCompliant).length, breach: items.filter(r => !r.isCompliant).length };
  });

  const byLocation = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return {
      name: loc.split(' ')[0],
      compliant: items.filter(r => r.isCompliant).length,
      nonCompliant: items.filter(r => !r.isCompliant).length,
      rate: Math.round(items.filter(r => r.isCompliant).length / (items.length || 1) * 100),
    };
  });

  const compliancePie = [
    { name: 'Compliant', value: compliantCount, fill: '#10B981' },
    { name: 'Non-Compliant', value: breachCount, fill: 'hsl(var(--destructive))' },
  ];

  // Time slot analysis
  const timeSlots = [...new Set(filtered.map(r => r.timeSlot))].sort();
  const timeSlotData = timeSlots.map(ts => {
    const items = filtered.filter(r => r.timeSlot === ts);
    return { time: ts, rate: Math.round(items.filter(r => r.isCompliant).length / (items.length || 1) * 100), breaches: items.filter(r => !r.isCompliant).length };
  });

  // Breach locations
  const breachLocations = byLocation.filter(l => l.nonCompliant > 0).sort((a, b) => b.nonCompliant - a.nonCompliant);

  const sparkline = [88, 90, 85, 92, 89, complianceRate];

  const insights = useMemo(() => {
    const result: { type: 'positive' | 'negative' | 'action' | 'neutral'; title: string; description: string; metric?: string; action?: string }[] = [];
    if (complianceRate >= 95) {
      result.push({ type: 'positive', title: 'Excellent Compliance', description: `${complianceRate}% compliance rate across ${filtered.length} checks. Only ${breachCount} breaches detected.`, metric: `${compliantCount}/${filtered.length} compliant` });
    } else if (complianceRate >= 80) {
      result.push({ type: 'action', title: 'Compliance Needs Attention', description: `${complianceRate}% compliance rate is below the 95% target. ${breachCount} ratio breaches require review.`, metric: `${breachCount} breaches`, action: 'Review non-compliant areas and adjust staffing' });
    } else {
      result.push({ type: 'negative', title: 'Critical Compliance Failure', description: `${complianceRate}% compliance is well below the 95% target. This represents significant regulatory risk.`, metric: `${breachCount} breaches`, action: 'Immediate staffing review required' });
    }
    if (staffSurplus > 0) {
      result.push({ type: 'neutral', title: `Staff Surplus: ${staffSurplus}`, description: `${totalActualStaff} actual staff vs ${totalRequiredStaff} required across all checks. Surplus staff represent additional labour cost.`, metric: `${staffSurplus} extra staff positions`, action: 'Evaluate if surplus is intentional buffer or inefficiency' });
    } else if (staffSurplus < 0) {
      result.push({ type: 'negative', title: `Staff Deficit: ${Math.abs(staffSurplus)}`, description: `${Math.abs(staffSurplus)} fewer staff than required. This directly causes ratio breaches.`, action: 'Fill open positions or deploy cross-location staff' });
    }
    if (breachLocations.length > 0) {
      result.push({ type: 'action', title: `${breachLocations[0].name} Has Most Breaches`, description: `${breachLocations[0].nonCompliant} non-compliant checks at this location. Compliance rate: ${breachLocations[0].rate}%.`, action: 'Prioritise staffing review at this location' });
    }
    const worstTimeSlot = timeSlotData.reduce((worst, ts) => ts.rate < worst.rate ? ts : worst, timeSlotData[0]);
    if (worstTimeSlot && worstTimeSlot.rate < 90) {
      result.push({ type: 'action', title: `${worstTimeSlot.time} Has Lowest Compliance`, description: `Only ${worstTimeSlot.rate}% compliant during ${worstTimeSlot.time}. ${worstTimeSlot.breaches} breaches at this time.`, action: 'Review rostering for this time period' });
    }
    return result;
  }, [filtered, complianceRate, breachCount, compliantCount, staffSurplus, totalActualStaff, totalRequiredStaff, breachLocations, timeSlotData]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staffing Ratio Compliance (NQF)" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Staffing Ratio Compliance (NQF)"
        reportDescription="Real-time monitoring of staffing ratios against regulatory requirements (NQF standards) across all locations, areas, and time periods. Tracks compliance status, identifies breaches, and supports audit documentation."
        purpose="This report ensures your organisation meets mandatory staffing ratio requirements set by the National Quality Framework (NQF) or equivalent regulations. It compares required staff-to-attendance ratios against actual staffing levels across every area and time slot, highlighting breaches that could result in regulatory penalties or quality concerns."
        whenToUse={[
          'Daily monitoring to ensure all areas meet staffing ratio requirements',
          'During regulatory inspections or audit preparation to demonstrate compliance history',
          'When planning rosters to identify time slots prone to ratio breaches',
          'After staffing changes to verify compliance is maintained',
          'During incident investigations where ratio compliance may be a factor',
        ]}
        keyMetrics={[
          { label: 'Compliance Rate', description: 'Percentage of all ratio checks that meet or exceed the required ratio.', interpretation: 'The primary compliance indicator. Should be 95%+ for regulatory safety. Below 80% indicates systemic staffing issues.', goodRange: '≥ 95%', warningRange: '80–94%', criticalRange: '< 80%' },
          { label: 'Ratio Breaches', description: 'Count of checks where actual staffing fell below the required ratio.', interpretation: 'Each breach is a potential regulatory violation. Track by location and time slot to identify patterns.', goodRange: '0', warningRange: '1-5', criticalRange: '> 5' },
          { label: 'Staff Surplus/Deficit', description: 'Difference between actual staff deployed and staff required by ratios.', interpretation: 'Positive = surplus (higher cost but safer). Negative = deficit (breach risk). Target a small positive buffer.', goodRange: '+1 to +3', warningRange: '0 or +4 to +6', criticalRange: 'Negative' },
          { label: 'Total Attendance', description: 'Sum of attendees/clients being served across all areas.', interpretation: 'Higher attendance requires more staff. Cross-reference with capacity to ensure areas are not overloaded.' },
          { label: 'Checks Performed', description: 'Total number of ratio compliance checks in the reporting period.', interpretation: 'More checks provide higher confidence in compliance data. Low check counts may indicate monitoring gaps.' },
        ]}
        howToRead={[
          { title: 'KPI Summary Cards', content: 'Six cards provide immediate compliance status. The Compliance Rate card is the primary indicator — green (≥95%) means strong compliance, amber (80-94%) needs attention, red (<80%) requires immediate action. Sparklines show 6-period trends.' },
          { title: 'Compliance Pie Chart', content: 'Visual split between compliant and non-compliant checks. A nearly-full green pie is ideal. Any visible red segment should trigger investigation.' },
          { title: 'Compliance by Location (Stacked Bar)', content: 'Shows each location with compliant (green) and non-compliant (red) checks stacked. Locations with visible red bars need staffing review. Compare bar heights to see which locations have the most checks.' },
          { title: 'Category Compliance', content: 'Breakdown by service category showing compliance vs breaches. Categories with high breach counts may need different ratio configurations or dedicated staffing.' },
          { title: 'Compliance by Time Slot', content: 'Area chart showing compliance rates across different time periods. Dips below the target line indicate times when staffing is insufficient — typically during shift transitions or breaks.' },
          { title: 'Detail Table', content: 'Every ratio check with required vs actual ratios. Red-highlighted actual ratios indicate breaches. Sort by compliance status to see all breaches first. Export for regulatory audit documentation.' },
        ]}
        actionableInsights={[
          'Address all current breaches before the next regulatory check period',
          'If breaches cluster at specific time slots, adjust roster shift patterns to ensure coverage during transitions',
          'Locations with consistently low compliance rates may need permanent headcount increases',
          'Use staff surplus data to optimise cross-location deployment without creating breaches',
          'Cross-reference with attendance trends to predict future ratio requirements and staff proactively',
        ]}
        relatedReports={['Coverage Gap Analysis', 'Area Utilisation Report', 'Compliance Violation Summary', 'Cross-Location Staff Deployment']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Compliance Rate" value={`${complianceRate}%`} icon={ShieldCheck}
          variant={complianceRate >= 95 ? 'success' : complianceRate >= 80 ? 'warning' : 'danger'}
          sparklineData={sparkline} trend={{ value: 1.5, label: 'vs prior period' }} />
        <StatCard label="Ratio Breaches" value={breachCount} icon={ShieldAlert}
          variant={breachCount > 5 ? 'danger' : breachCount > 0 ? 'warning' : 'success'}
          trend={{ value: -3, label: 'vs prior period', isPositiveGood: false }} />
        <StatCard label="Checks Performed" value={filtered.length} icon={BarChart3} subtitle={`${locations.length} locations`} />
        <StatCard label="Total Attendance" value={totalAttendance} icon={Users}
          trend={{ value: 2.8, label: 'vs prior period' }} />
        <StatCard label="Staff Surplus/Deficit" value={staffSurplus >= 0 ? `+${staffSurplus}` : `${staffSurplus}`} icon={staffSurplus >= 0 ? CheckCircle2 : AlertTriangle}
          variant={staffSurplus < 0 ? 'danger' : staffSurplus > 6 ? 'warning' : 'success'} subtitle={`${totalActualStaff} actual / ${totalRequiredStaff} req.`} />
        <StatCard label="Worst Location" value={breachLocations.length > 0 ? `${breachLocations[0].rate}%` : '100%'} icon={AlertTriangle}
          variant={breachLocations.length > 0 && breachLocations[0].rate < 80 ? 'danger' : 'warning'}
          subtitle={breachLocations.length > 0 ? breachLocations[0].name : 'All compliant'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => <InsightCard key={i} {...insight} />)}
      </div>

      <SummaryRow items={[
        { label: 'Compliant', value: compliantCount },
        { label: 'Non-Compliant', value: breachCount, highlight: breachCount > 0 },
        { label: 'Categories', value: categories.length },
        { label: 'Time Slots', value: timeSlots.length },
        { label: 'Avg Staff/Check', value: Math.round(totalActualStaff / (filtered.length || 1) * 10) / 10 },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance Overview</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={compliancePie} cursor="pointer" onClick={(_, index) => { const d = compliancePie[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {compliancePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={byLocation} cursor="pointer" onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="compliant" name="Compliant" stackId="a" fill="#10B981" />
                <Bar dataKey="nonCompliant" name="Non-Compliant" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategoryCompliance} cursor="pointer" onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="compliant" name="Compliant" stackId="a" fill="#10B981" />
                <Bar dataKey="breach" name="Breach" stackId="a" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance by Time Slot</CardTitle></CardHeader>
        <CardContent>
          <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeSlotData}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="rate" name="Compliance %" stroke="#10B981" fill="url(#rateGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer></AnimatedChartWrapper>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Ratio Checks — Detailed</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.areaName}-${r.timeSlot}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
