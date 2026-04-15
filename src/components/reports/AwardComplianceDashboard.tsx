import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAwardOverrides, awardComplianceTrend } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Shield, CheckCircle2, AlertTriangle, FileWarning } from 'lucide-react';

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
  const totalOverrides = mockAwardOverrides.length;
  const activeOverrides = mockAwardOverrides.filter(r => !r.expiryDate || new Date(r.expiryDate) > new Date()).length;

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Award Compliance Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={awardComplianceTrend} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Compliance Rate', value: `${latestCompliance.complianceRate.toFixed(1)}%`, icon: Shield, color: 'text-emerald-600' },
          { label: 'Active Overrides', value: activeOverrides, icon: FileWarning, color: 'text-foreground' },
          { label: 'Total Overrides', value: totalOverrides, icon: AlertTriangle, color: 'text-foreground' },
          { label: 'Open Violations', value: Math.round(latestCompliance.violations), icon: CheckCircle2, color: latestCompliance.violations > 2 ? 'text-destructive' : 'text-emerald-600' },
        ].map(c => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4">
              <c.icon className="h-4 w-4 text-muted-foreground mb-1" />
              <p className={cn('text-2xl font-bold tracking-tight', c.color)}>{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={awardComplianceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="complianceRate" name="Compliance %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overrides & Violations</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
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
