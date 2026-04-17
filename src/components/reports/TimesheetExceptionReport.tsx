import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockTimesheetExceptions, exceptionTypeLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { FileEdit, AlertTriangle, Shield, Users, Clock, Eye } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


type TimesheetExceptionRecord = typeof mockTimesheetExceptions[0];

const typeColors: Record<string, string> = {
  manual_edit: 'bg-amber-100 text-amber-700', manager_override: 'bg-orange-100 text-orange-700',
  time_adjustment: 'bg-sky-100 text-sky-700', retroactive_entry: 'bg-purple-100 text-purple-700',
  system_correction: 'bg-emerald-100 text-emerald-700',
};
const typeFills: Record<string, string> = {
  manual_edit: '#F59E0B', manager_override: '#F97316',
  time_adjustment: 'hsl(var(--primary))', retroactive_entry: '#8B5CF6',
  system_correction: '#10B981',
};

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Type', accessor: (r: any) => exceptionTypeLabels[r.exceptionType] },
  { header: 'Field', accessor: 'field' }, { header: 'Original', accessor: 'originalValue' },
  { header: 'New Value', accessor: 'newValue' }, { header: 'Edited By', accessor: 'editedBy' },
  { header: 'Reason', accessor: 'reason' },
];

const locations = [...new Set(mockTimesheetExceptions.map(r => r.location))];

const tableColumns: DataTableColumn<TimesheetExceptionRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'number', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => format(parseISO(r.date), 'dd MMM'), sortValue: (r) => r.date },
  { key: 'exceptionType', header: 'Type', sortValue: (r) => r.exceptionType,
    accessor: (r) => <Badge className={cn('text-[10px]', typeColors[r.exceptionType])}>{exceptionTypeLabels[r.exceptionType]}</Badge> },
  { key: 'field', header: 'Field', accessor: (r) => <span className="text-xs">{r.field}</span>, sortValue: (r) => r.field },
  { key: 'originalValue', header: 'Original', accessor: (r) => <span className="text-xs text-muted-foreground line-through">{r.originalValue}</span>, sortValue: (r) => r.originalValue },
  { key: 'newValue', header: 'New', accessor: (r) => <span className="text-xs font-medium">{r.newValue}</span>, sortValue: (r) => r.newValue },
  { key: 'editedBy', header: 'Edited By', accessor: (r) => <span className="text-xs">{r.editedBy}</span>, sortValue: (r) => r.editedBy },
  { key: 'reason', header: 'Reason', accessor: (r) => <span className="text-xs text-muted-foreground max-w-[200px] truncate block">{r.reason}</span>, sortValue: (r) => r.reason },
];

export function TimesheetExceptionReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockTimesheetExceptions.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.editedBy.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), dateRange), [search, locationFilter, dateRange]);

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


  const managerOverrides = filtered.filter(r => r.exceptionType === 'manager_override').length;
  const retroactiveEntries = filtered.filter(r => r.exceptionType === 'retroactive_entry').length;
  const manualEdits = filtered.filter(r => r.exceptionType === 'manual_edit').length;
  const exceptionRate = filtered.length > 0 ? Math.round((filtered.length / (filtered.length + 50)) * 100) : 0; // approximate

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(r => { c[r.exceptionType] = (c[r.exceptionType] || 0) + 1; });
    return Object.entries(c).map(([k, v]) => ({ name: exceptionTypeLabels[k as keyof typeof exceptionTypeLabels], value: v, type: k }));
  }, [filtered]);

  // Editor analysis
  const editorStats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.editedBy] = (map[r.editedBy] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([editor, count]) => ({ editor: editor.split(' ')[0], count }));
  }, [filtered]);

  const COLORS = ['#F59E0B', '#F97316', 'hsl(var(--primary))', '#8B5CF6', '#10B981'];

  const insights = useMemo(() => {
    const result = [];
    if (managerOverrides > 0) result.push({ type: 'action' as const, title: `${managerOverrides} manager overrides this period`, description: `Manager overrides bypass normal timesheet workflow. While sometimes necessary, high volumes may indicate process issues or staff training gaps. Each override should have documented justification.`, metric: `${Math.round(managerOverrides / filtered.length * 100)}% of all exceptions`, action: 'Audit override reasons and validate justifications' });
    if (retroactiveEntries > 0) result.push({ type: 'negative' as const, title: `${retroactiveEntries} retroactive entries detected`, description: `Retroactive modifications to timesheets after the pay period require careful audit. These changes affect already-processed payroll and may require adjustment payments.`, action: 'Cross-reference with payroll adjustments to ensure accuracy' });
    if (filtered.length > 10) result.push({ type: 'neutral' as const, title: `${filtered.length} total exceptions — ${exceptionRate}% exception rate`, description: `An exception rate above 15% suggests systemic data capture issues. Common causes: unclear time recording processes, faulty clock-in devices, or inadequate staff training.`, metric: `${exceptionRate}% of all timesheets modified` });
    if (editorStats.length > 0 && editorStats[0].count > 3) result.push({ type: 'neutral' as const, title: `Top editor: ${editorStats[0].editor} (${editorStats[0].count} changes)`, description: `This editor made the most modifications. High individual edit counts may indicate they're compensating for upstream data quality issues.`, action: 'Review whether root causes can be addressed to reduce edits' });
    return result;
  }, [filtered, managerOverrides, retroactiveEntries, exceptionRate, editorStats]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Timesheet Exception Report"
        reportDescription="Full audit trail of all timesheet modifications including manual edits, manager overrides, time adjustments, retroactive entries, and system corrections. Supports compliance and fraud detection."
        purpose="To maintain data integrity and provide a complete audit trail of all timesheet changes. Essential for payroll accuracy, compliance reviews, and identifying potential time fraud or systematic process issues."
        whenToUse={['Before payroll processing to review all modifications', 'During internal audits', 'When investigating timesheet discrepancies', 'For compliance with record-keeping obligations']}
        keyMetrics={[
          { label: 'Exception Rate', description: 'Percentage of timesheets that required manual modification.', interpretation: 'Above 15% indicates systematic issues with time capture.', goodRange: '<10%', warningRange: '10-15%', criticalRange: '>15%' },
          { label: 'Manager Overrides', description: 'Count of changes made by managers bypassing normal approval flow.', interpretation: 'Each should have a documented reason. High counts warrant process review.' },
          { label: 'Retroactive Entries', description: 'Changes to already-processed timesheet periods.', interpretation: 'These require payroll adjustments and should be minimised.' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Quick audit summary showing total exceptions, types, and rate. Focus on overrides and retroactive entries as highest-risk categories.' },
          { title: 'Exception Type Chart', content: 'Shows distribution of exception types. A healthy profile has mostly "system corrections" and few "manager overrides".' },
          { title: 'Editor Analysis', content: 'Identifies who is making the most changes — useful for training and process improvement.' },
          { title: 'Detail Table', content: 'Full audit trail showing original vs new values with reasons. The strikethrough original value makes changes immediately visible.' },
        ]}
        actionableInsights={['Investigate all manager overrides without documented reasons', 'Retroactive entries should be cross-referenced with payroll adjustments', 'High edit volumes by one person may indicate training needs or process gaps', 'Track exception rate trends — declining rates indicate improving data quality']}
        relatedReports={['Weekly Timesheet Summary', 'Approval SLA', 'Retrospective Pay Adjustment']}
      />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportFilterBar title="Timesheet Exception Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff or editor..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Exceptions" value={filtered.length} icon={FileEdit} sparklineData={[5, 8, 12, 10, filtered.length]} />
        <StatCard label="Manager Overrides" value={managerOverrides} icon={Shield} variant={managerOverrides > 3 ? 'warning' : 'default'} />
        <StatCard label="Retroactive" value={retroactiveEntries} icon={Clock} variant={retroactiveEntries > 0 ? 'danger' : 'default'} />
        <StatCard label="Manual Edits" value={manualEdits} icon={AlertTriangle} />
        <StatCard label="Exception Rate" value={`${exceptionRate}%`} icon={Eye} variant={exceptionRate > 15 ? 'danger' : exceptionRate > 10 ? 'warning' : 'default'} />
        <StatCard label="Unique Editors" value={editorStats.length} icon={Users} />
      </div>

      <SummaryRow items={[
        { label: 'Fields Modified', value: new Set(filtered.map(r => r.field)).size },
        { label: 'Staff Affected', value: new Set(filtered.map(r => r.staffName)).size },
        { label: 'Top Editor', value: editorStats[0]?.editor || 'N/A', highlight: true },
        { label: 'System Corrections', value: filtered.filter(r => r.exceptionType === 'system_correction').length },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Exceptions by Type</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={typeCounts} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {typeCounts.map((entry, i) => <Cell key={i} fill={typeFills[entry.type] || 'hsl(var(--primary))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Changes by Editor</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={editorStats} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="editor" type="category" tick={{ fontSize: 11 }} width={60} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Edits" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Exception Audit Trail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
