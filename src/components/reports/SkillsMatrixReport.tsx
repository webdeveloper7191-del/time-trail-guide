import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockSkillsMatrix, SkillsMatrixRecord } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { Award, Users, Target, TrendingUp, BookOpen, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const levelColors: Record<string, string> = {
  beginner: 'bg-muted text-muted-foreground', intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-emerald-100 text-emerald-800', expert: 'bg-purple-100 text-purple-800',
};
const levelValue: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
const COLORS = ['hsl(var(--muted-foreground))', 'hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(263, 70%, 50%)'];

const locations = [...new Set(mockSkillsMatrix.map(r => r.location))];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Department', accessor: 'department' },
  { header: 'Skills', accessor: (r: any) => r.skills.map((s: any) => `${s.name} (${s.level})`).join(', ') },
  { header: 'Total Skills', accessor: 'totalSkills' }, { header: 'Certifications', accessor: 'certifications' },
];

const tableColumns: DataTableColumn<SkillsMatrixRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => <div><span className="font-medium">{r.staffName}</span><span className="block text-[10px] text-muted-foreground">{r.department}</span></div>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'skills', header: 'Skills', type: 'text', accessor: (r) => (
    <div className="flex flex-wrap gap-1">{r.skills.map(s => <Badge key={s.name} className={`text-[10px] ${levelColors[s.level]}`}>{s.name} • {s.level}</Badge>)}</div>
  ), sortValue: (r) => r.totalSkills },
  { key: 'totalSkills', header: 'Count', type: 'number', accessor: (r) => <span className="font-semibold">{r.totalSkills}</span>, sortValue: (r) => r.totalSkills, align: 'right' },
  { key: 'avgLevel', header: 'Avg Level', type: 'number', align: 'right', sortValue: (r) => r.skills.reduce((s, sk) => s + levelValue[sk.level], 0) / (r.skills.length || 1),
    accessor: (r) => { const avg = r.skills.reduce((s, sk) => s + levelValue[sk.level], 0) / (r.skills.length || 1); return <span className={cn('text-xs font-medium', avg >= 3 ? 'text-emerald-600' : avg >= 2 ? 'text-foreground' : 'text-amber-600')}>{avg.toFixed(1)}</span>; }},
  { key: 'certifications', header: 'Certs', type: 'text', accessor: (r) => r.certifications > 0 ? <Badge variant="outline" className="text-[10px]">{r.certifications}</Badge> : '—', sortValue: (r) => r.certifications, align: 'right' },
  { key: 'role', header: 'Role', type: 'enum', accessor: (r) => <Badge variant="outline" className="text-[10px]">{r.role}</Badge>, sortValue: (r) => r.role ?? '' },
  { key: 'avgSkillLevel', header: 'Avg Level', type: 'number', accessor: (r) => <span className="font-mono text-xs">{(r.avgSkillLevel ?? 0).toFixed(1)}</span>, sortValue: (r) => r.avgSkillLevel ?? 0, align: 'right' },
  { key: 'expertSkills', header: 'Expert', type: 'number', accessor: (r) => (r.expertSkills ?? 0) > 0 ? <Badge variant="secondary" className="text-[10px]">{r.expertSkills}</Badge> : '—', sortValue: (r) => r.expertSkills ?? 0, align: 'right' },
  { key: 'skillsGap', header: 'Gap', type: 'number', accessor: (r) => (r.skillsGap ?? 0) > 0 ? <span className="text-amber-600 font-medium text-xs">{r.skillsGap}</span> : <span className="text-emerald-600 text-xs">0</span>, sortValue: (r) => r.skillsGap ?? 0, align: 'right' },
  { key: 'lastTrainingDate', header: 'Last Training', type: 'date', accessor: (r) => <span className="text-[10px] text-muted-foreground">{r.lastTrainingDate}</span>, sortValue: (r) => r.lastTrainingDate ?? '' },
];

export function SkillsMatrixReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    return filterByDateRange(mockSkillsMatrix.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase()) && !r.skills.some(s => s.name.toLowerCase().includes(search.toLowerCase()))) return false;
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


  const totalSkills = filtered.reduce((s, r) => s + r.totalSkills, 0);
  const totalCerts = filtered.reduce((s, r) => s + r.certifications, 0);
  const avgSkillsPerStaff = filtered.length ? (totalSkills / filtered.length).toFixed(1) : '0';
  const allSkills = filtered.flatMap(r => r.skills);
  const avgLevel = allSkills.length ? (allSkills.reduce((s, sk) => s + levelValue[sk.level], 0) / allSkills.length).toFixed(1) : '0';
  const expertCount = allSkills.filter(s => s.level === 'expert').length;
  const beginnerCount = allSkills.filter(s => s.level === 'beginner').length;

  const skillCoverage = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => r.skills.forEach(s => { map[s.name] = (map[s.name] || 0) + 1; }));
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const levelDistribution = [
    { name: 'Beginner', value: beginnerCount }, { name: 'Intermediate', value: allSkills.filter(s => s.level === 'intermediate').length },
    { name: 'Advanced', value: allSkills.filter(s => s.level === 'advanced').length }, { name: 'Expert', value: expertCount },
  ];

  const radarData = skillCoverage.map(sc => ({
    skill: sc.name, coverage: sc.count, maxPossible: filtered.length,
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staff Skills Matrix" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff or skills..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Staff Skills Matrix Report"
        reportDescription="Maps staff capabilities across skill areas and proficiency levels, identifying strengths, gaps, and development opportunities."
        purpose="Enables strategic workforce development by visualising skill coverage, identifying single points of failure, and supporting training investment decisions."
        whenToUse={[
          'During workforce planning to assess capability gaps', 'When deciding training and development budgets',
          'Before restructuring to understand capability distribution', 'When identifying successors for critical roles',
          'For compliance — ensuring minimum skill coverage requirements',
        ]}
        keyMetrics={[
          { label: 'Avg Skills/Staff', description: 'Average number of recorded skills per staff member', interpretation: 'Target 3-4+ for operational flexibility. Below 2 indicates limited cross-training', goodRange: '≥3', warningRange: '2-2.9', criticalRange: '<2' },
          { label: 'Avg Proficiency', description: 'Average level on 1-4 scale (Beginner→Expert)', interpretation: 'Target ≥2.5 for workforce maturity. Below 2 indicates heavy training investment needed', goodRange: '≥3', warningRange: '2-2.9', criticalRange: '<2' },
          { label: 'Expert Skills', description: 'Count of skills at expert proficiency', interpretation: 'Experts are critical knowledge holders. If concentrated in few staff, creates succession risk' },
          { label: 'Skill Coverage', description: 'Number of staff possessing each skill', interpretation: 'Skills held by <2 staff are single-points-of-failure requiring urgent cross-training' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows workforce capability summary — skills breadth, depth, and certification coverage.' },
          { title: 'Skill Coverage Chart', content: 'Horizontal bar chart shows how many staff hold each skill. Skills with low coverage represent operational risk.' },
          { title: 'Proficiency Distribution', content: 'Pie chart shows the proportion of skills at each level. A mature workforce should have <20% at beginner level.' },
          { title: 'Capability Radar', content: 'Spider chart comparing actual coverage vs maximum possible for each skill. Gaps in the radar indicate training priorities.' },
          { title: 'Detail Table', content: 'Colour-coded skill badges show proficiency at a glance. Avg Level column identifies staff needing development.' },
        ]}
        actionableInsights={[
          'Skills held by only 1 person are critical risks — prioritise cross-training immediately',
          'Staff with <2 skills should be enrolled in capability development programs',
          'High beginner ratios (>30%) suggest recent hires need accelerated training pathways',
          'Cross-reference with qualification expiry to ensure certified skills remain valid',
        ]}
        relatedReports={['Qualification & Certification Expiry', 'Headcount & FTE', 'Schedule Fairness', 'Staff Utilisation']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Staff" value={filtered.length} icon={Users} size="sm" />
        <StatCard label="Avg Skills/Staff" value={avgSkillsPerStaff} icon={Target} variant={Number(avgSkillsPerStaff) >= 3 ? 'success' : Number(avgSkillsPerStaff) >= 2 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="Avg Proficiency" value={avgLevel} icon={TrendingUp} variant={Number(avgLevel) >= 3 ? 'success' : Number(avgLevel) >= 2 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="Expert Skills" value={expertCount} icon={Star} variant="success" size="sm" />
        <StatCard label="Certifications" value={totalCerts} icon={Award} size="sm" />
        <StatCard label="Unique Skills" value={skillCoverage.length} icon={BookOpen} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {beginnerCount / allSkills.length > 0.3 && <InsightCard type="action" title="High Beginner Ratio" description={`${Math.round(beginnerCount / allSkills.length * 100)}% of skills are at beginner level. Accelerated training programs recommended.`} action="Create skill development pathways" />}
        {skillCoverage.some(s => s.count === 1) && <InsightCard type="negative" title="Single-Person Dependencies" description={`${skillCoverage.filter(s => s.count === 1).length} skills are held by only one person — creating operational risk if they're unavailable.`} action="Prioritise cross-training for critical skills" />}
        {Number(avgSkillsPerStaff) >= 3 && <InsightCard type="positive" title="Good Skill Breadth" description={`Average of ${avgSkillsPerStaff} skills per staff provides scheduling flexibility and coverage resilience.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Staff', value: filtered.length }, { label: 'Total Skills', value: totalSkills, highlight: true },
        { label: 'Avg/Staff', value: avgSkillsPerStaff }, { label: 'Expert', value: expertCount, highlight: true },
        { label: 'Beginner', value: beginnerCount }, { label: 'Certs', value: totalCerts },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Skill Coverage</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={skillCoverage} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Staff Count" />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Proficiency Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={levelDistribution.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {levelDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Capability Radar</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name="Coverage" dataKey="coverage" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Radar name="Max Possible" dataKey="maxPossible" stroke="hsl(var(--muted-foreground))" fill="none" strokeDasharray="5 5" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Staff Skills Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.staffName}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
