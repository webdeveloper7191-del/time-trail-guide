import { useState, useMemo } from 'react';
import { Timesheet, ClockEntry } from '@/types/timesheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/timesheet/StatCard';
import { formatTime12h } from '@/lib/timeFormat';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { format, parseISO, isValid, isWithinInterval, subDays, startOfMonth } from 'date-fns';
import {
  CalendarIcon, ChevronLeft, ChevronRight, Search, Filter, Clock, Coffee,
  AlertTriangle, CheckCircle2, Pencil, Users, Download,
} from 'lucide-react';
import { exportToCSV, ExportColumn } from '@/lib/reportExport';

interface DailyPunch {
  key: string;
  timesheet: Timesheet;
  entry: ClockEntry;
  date: string;
  staffName: string;
  staffId: string;
  position: string;
  locationId: string;
  locationName: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  breakCount: number;
  netHours: number;
  overtime: number;
  edited: boolean;
  hasException: boolean;
  issue: 'ok' | 'missing_out' | 'no_break' | 'overtime' | 'exception' | 'absent';
}

const issueMeta: Record<DailyPunch['issue'], { label: string; className: string }> = {
  ok: { label: 'Complete', className: 'bg-status-approved/10 text-status-approved border-status-approved/20' },
  missing_out: { label: 'Missing clock-out', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  no_break: { label: 'No break recorded', className: 'bg-status-pending/10 text-status-pending border-status-pending/20' },
  overtime: { label: 'Overtime', className: 'bg-primary/10 text-primary border-primary/20' },
  exception: { label: 'Exception raised', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  absent: { label: 'Absent / zero hours', className: 'bg-muted text-muted-foreground border-border' },
};

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: 'date' },
  { header: 'Staff', accessor: 'staffName' },
  { header: 'Location', accessor: 'locationName' },
  { header: 'Clock In', accessor: (r: any) => formatTime12h(r.clockIn) },
  { header: 'Clock Out', accessor: (r: any) => (r.clockOut ? formatTime12h(r.clockOut) : '—') },
  { header: 'Break (min)', accessor: 'breakMinutes' },
  { header: 'Net Hours', accessor: 'netHours' },
  { header: 'Overtime', accessor: 'overtime' },
  { header: 'Status', accessor: (r: any) => issueMeta[r.issue as DailyPunch['issue']].label },
];

interface DailyClockViewProps {
  timesheets: Timesheet[];
  onViewTimesheet?: (timesheet: Timesheet) => void;
  onEditTimesheet?: (timesheet: Timesheet) => void;
}

export function DailyClockView({ timesheets, onViewTimesheet, onEditTimesheet }: DailyClockViewProps) {
  const allPunches = useMemo<DailyPunch[]>(() => {
    const rows: DailyPunch[] = [];
    timesheets.forEach(ts => {
      ts.entries.forEach(entry => {
        const missingOut = !entry.clockOut;
        const absent = !missingOut && entry.netHours === 0;
        const issue: DailyPunch['issue'] = entry.exception && !entry.exception.resolved
          ? 'exception'
          : missingOut
            ? 'missing_out'
            : absent
              ? 'absent'
              : entry.totalBreakMinutes === 0 && entry.grossHours >= 5
                ? 'no_break'
                : entry.overtime > 0
                  ? 'overtime'
                  : 'ok';
        rows.push({
          key: `${ts.id}-${entry.id}`,
          timesheet: ts,
          entry,
          date: entry.date,
          staffName: ts.employee.name,
          staffId: ts.employee.id,
          position: ts.employee.position,
          locationId: ts.location.id,
          locationName: ts.location.name,
          clockIn: entry.clockIn,
          clockOut: entry.clockOut,
          breakMinutes: entry.totalBreakMinutes,
          breakCount: entry.breaks.length,
          netHours: entry.netHours,
          overtime: entry.overtime,
          edited: !!entry.wasEdited,
          hasException: !!entry.exception,
          issue,
        });
      });
    });
    return rows.sort((a, b) => (a.date === b.date ? a.staffName.localeCompare(b.staffName) : b.date.localeCompare(a.date)));
  }, [timesheets]);

  const latestDate = useMemo(() => {
    const d = allPunches[0]?.date;
    const parsed = d ? parseISO(d) : new Date();
    return isValid(parsed) ? parsed : new Date();
  }, [allPunches]);

  const [range, setRange] = useState<DateRange | undefined>({ from: latestDate, to: latestDate });
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState<'all' | DailyPunch['issue']>('all');

  const locationOptions = useMemo(() => {
    const map = new Map<string, string>();
    allPunches.forEach(p => map.set(p.locationId, p.locationName));
    return [...map.entries()];
  }, [allPunches]);

  const filtered = useMemo(() => allPunches.filter(p => {
    if (range?.from) {
      const d = parseISO(p.date);
      if (!isValid(d) || !isWithinInterval(d, { start: range.from, end: range.to || range.from })) return false;
    }
    if (locationFilter !== 'all' && p.locationId !== locationFilter) return false;
    if (issueFilter !== 'all' && p.issue !== issueFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.staffName.toLowerCase().includes(q) && !p.staffId.toLowerCase().includes(q) && !p.position.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [allPunches, range, locationFilter, issueFilter, search]);

  const stats = useMemo(() => ({
    punches: filtered.length,
    staff: new Set(filtered.map(p => p.staffId)).size,
    hours: filtered.reduce((s, p) => s + p.netHours, 0),
    breaks: filtered.reduce((s, p) => s + p.breakMinutes, 0),
    overtime: filtered.reduce((s, p) => s + p.overtime, 0),
    issues: filtered.filter(p => p.issue !== 'ok' && p.issue !== 'overtime').length,
  }), [filtered]);

  const shiftDays = (days: number) => {
    const from = range?.from || latestDate;
    const to = range?.to || from;
    setRange({ from: subDays(from, -days), to: subDays(to, -days) });
  };

  const setPreset = (preset: string) => {
    const today = new Date();
    if (preset === 'latest') setRange({ from: latestDate, to: latestDate });
    else if (preset === 'today') setRange({ from: today, to: today });
    else if (preset === 'yesterday') setRange({ from: subDays(today, 1), to: subDays(today, 1) });
    else if (preset === '7') setRange({ from: subDays(today, 6), to: today });
    else if (preset === '30') setRange({ from: subDays(today, 29), to: today });
    else if (preset === 'month') setRange({ from: startOfMonth(today), to: today });
    else if (preset === 'all') setRange(undefined);
  };

  const rangeLabel = !range?.from
    ? 'All dates'
    : range.to && format(range.to, 'yyyy-MM-dd') !== format(range.from, 'yyyy-MM-dd')
      ? `${format(range.from, 'd MMM yyyy')} – ${format(range.to, 'd MMM yyyy')}`
      : format(range.from, 'EEE d MMM yyyy');

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => shiftDays(-1)} disabled={!range?.from}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start font-normal">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {rangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus className={cn('p-3 pointer-events-auto')} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" aria-label="Next day" onClick={() => shiftDays(1)} disabled={!range?.from}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select onValueChange={setPreset}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Quick range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest recorded day</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="all">All history</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locationOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={issueFilter} onValueChange={(v) => setIssueFilter(v as typeof issueFilter)}>
          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All punches</SelectItem>
            <SelectItem value="ok">Complete</SelectItem>
            <SelectItem value="missing_out">Missing clock-out</SelectItem>
            <SelectItem value="no_break">No break recorded</SelectItem>
            <SelectItem value="overtime">Overtime</SelectItem>
            <SelectItem value="exception">Exception raised</SelectItem>
            <SelectItem value="absent">Absent / zero hours</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => exportToCSV(filtered, exportColumns, `daily-clock-${format(new Date(), 'yyyy-MM-dd')}`)}>
          <Download className="h-4 w-4 mr-2" />Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Punches" value={stats.punches} icon={Clock} subtitle={rangeLabel} />
        <StatCard title="Staff" value={stats.staff} icon={Users} />
        <StatCard title="Net Hours" value={`${stats.hours.toFixed(1)}h`} icon={Clock} />
        <StatCard title="Breaks" value={`${Math.round(stats.breaks / 6) / 10}h`} icon={Coffee} subtitle={`${stats.breaks} min`} />
        <StatCard title="Overtime" value={`${stats.overtime.toFixed(1)}h`} icon={AlertTriangle} />
        <StatCard title="Issues" value={stats.issues} icon={AlertTriangle} subtitle="Need review" />
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Daily clock records <span className="text-muted-foreground font-normal">({filtered.length})</span></CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Clock In</TableHead>
                <TableHead className="text-xs">Clock Out</TableHead>
                <TableHead className="text-xs">Breaks</TableHead>
                <TableHead className="text-xs text-right">Net Hours</TableHead>
                <TableHead className="text-xs text-right">OT</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-10">
                    No clock records for the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(p => (
                <TableRow key={p.key} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewTimesheet?.(p.timesheet)}>
                  <TableCell className="text-xs whitespace-nowrap">{format(parseISO(p.date), 'EEE d MMM')}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {p.staffName}
                    <div className="text-xs text-muted-foreground font-normal">{p.position}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.locationName}</TableCell>
                  <TableCell className="text-sm">{formatTime12h(p.clockIn)}</TableCell>
                  <TableCell className="text-sm">{p.clockOut ? formatTime12h(p.clockOut) : <span className="text-destructive">—</span>}</TableCell>
                  <TableCell className="text-xs">{p.breakCount > 0 ? `${p.breakCount} × ${p.breakMinutes}m total` : <span className="text-muted-foreground">None</span>}</TableCell>
                  <TableCell className="text-sm text-right">{p.netHours.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-right">{p.overtime > 0 ? `${p.overtime.toFixed(2)}` : '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn('text-xs', issueMeta[p.issue].className)}>
                        {p.issue === 'ok' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                        {issueMeta[p.issue].label}
                      </Badge>
                      {p.edited && <Badge variant="outline" className="text-xs"><Pencil className="h-3 w-3 mr-1" />Edited</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEditTimesheet?.(p.timesheet); }}>
                      Fix
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
