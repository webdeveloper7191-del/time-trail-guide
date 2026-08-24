import { useMemo, useState } from 'react';
import {
  Plus, Users, Repeat, CalendarClock, Bell, Search, Trash2, CheckCircle2,
  AlertTriangle, Clock, CircleDashed, XCircle, Eye, Download, ChevronDown,
  ExternalLink, ListChecks, FilterX, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockStaff } from '@/data/mockStaffData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AssignFormPanel from './AssignFormPanel';
import TaskDetailPanel, { buildResponseGroups } from './TaskDetailPanel';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useFormDelivery,
  formDeliveryStore,
  deriveStatus,
  summariseAssignment,
  TASK_STATUS_LABELS,
  type DerivedTaskStatus,
} from '@/lib/formDeliveryStore';

const STATUS_STYLES: Record<DerivedTaskStatus, string> = {
  not_started: 'bg-muted text-muted-foreground border-transparent',
  in_progress: 'bg-primary/10 text-primary border-transparent',
  submitted: 'bg-emerald-500/10 text-emerald-700 border-transparent',
  overdue: 'bg-destructive/10 text-destructive border-transparent',
  cancelled: 'bg-muted text-muted-foreground border-transparent line-through',
};

const STATUS_ICONS: Record<DerivedTaskStatus, React.ReactNode> = {
  not_started: <CircleDashed size={12} />,
  in_progress: <Clock size={12} />,
  submitted: <CheckCircle2 size={12} />,
  overdue: <AlertTriangle size={12} />,
  cancelled: <XCircle size={12} />,
};

/** staffId -> locations, sourced from the workforce master data. */
const STAFF_LOCATIONS: Record<string, string[]> = Object.fromEntries(
  mockStaff.map(s => [s.id, s.locations ?? []])
);
const staffLocations = (staffId: string) => STAFF_LOCATIONS[staffId] ?? [];

const csvEscape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

type SortKey = 'staff' | 'location' | 'form' | 'occurrence' | 'due';

const StaffAssignmentsPage = () => {
  const { assignments, tasks } = useFormDelivery();
  const [showAssign, setShowAssign] = useState(false);
  const [selectedId, setSelectedId] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DerivedTaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('due');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const now = new Date();

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => staffLocations(t.staffId).forEach(l => set.add(l)));
    return Array.from(set).sort();
  }, [tasks]);

  const templateOptions = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach(a => map.set(a.templateId, a.templateName));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  const filtersActive =
    locationFilter !== 'all' || templateFilter !== 'all' || !!fromDate || !!toDate || statusFilter !== 'all' || !!search;

  const clearFilters = () => {
    setLocationFilter('all');
    setTemplateFilter('all');
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
    setSearch('');
  };

  const scopedTasks = useMemo(
    () => (selectedId === 'all' ? tasks : tasks.filter(t => t.assignmentId === selectedId)),
    [tasks, selectedId]
  );

  const statusCounts = useMemo(() => {
    const c: Record<DerivedTaskStatus, number> = { not_started: 0, in_progress: 0, submitted: 0, overdue: 0, cancelled: 0 };
    scopedTasks.forEach(t => { c[deriveStatus(t, now)] += 1; });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedTasks]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedTasks
      .filter(t => statusFilter === 'all' || deriveStatus(t, now) === statusFilter)
      .filter(t => !q || t.staffName.toLowerCase().includes(q))
      .filter(t => locationFilter === 'all' || staffLocations(t.staffId).includes(locationFilter))
      .filter(t => {
        if (templateFilter === 'all') return true;
        const a = assignments.find(x => x.id === t.assignmentId);
        return a?.templateId === templateFilter;
      })
      .filter(t => (!fromDate || t.occurrenceDate >= fromDate) && (!toDate || t.occurrenceDate <= toDate))
      .sort((a, b) => {
        const formOf = (id: string) => assignments.find(x => x.id === id)?.templateName ?? '';
        const val = (t: typeof a) => {
          switch (sortKey) {
            case 'staff': return t.staffName.toLowerCase();
            case 'location': return staffLocations(t.staffId).join(', ').toLowerCase();
            case 'form': return formOf(t.assignmentId).toLowerCase();
            case 'occurrence': return t.occurrenceDate;
            default: return t.dueAt;
          }
        };
        const cmp = String(val(a)).localeCompare(String(val(b)), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedTasks, statusFilter, search, locationFilter, templateFilter, fromDate, toDate, assignments, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => (
    <th className={cn('py-2.5', className)}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(sortId)}>
        {label}
        {sortKey === sortId
          ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
          : <ArrowUpDown size={12} className="opacity-40" />}
      </button>
    </th>
  );

  const allVisibleSelected = visibleTasks.length > 0 && visibleTasks.every(t => selectedTaskIds.includes(t.id));
  const toggleSelectAll = () =>
    setSelectedTaskIds(allVisibleSelected ? [] : visibleTasks.map(t => t.id));
  const toggleSelect = (id: string) =>
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const buildRows = (list: typeof tasks) => [
    ['Assignment', 'Form', 'Staff', 'Locations', 'Occurrence', 'Due', 'Status', 'Submitted at', 'Reminders', 'Submission ID'],
    ...list.map(t => {
      const a = assignments.find(x => x.id === t.assignmentId);
      return [
        a?.title ?? '—',
        a?.templateName ?? '—',
        t.staffName,
        staffLocations(t.staffId).join(' | '),
        t.occurrenceDate,
        t.dueAt,
        TASK_STATUS_LABELS[deriveStatus(t, now)],
        t.submittedAt ?? '',
        String(t.remindersSent),
        t.submissionId ?? '',
      ];
    }),
  ];

  const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const exportCurrentView = () => {
    if (!visibleTasks.length) { toast.info('Nothing to export in this view.'); return; }
    downloadCsv(`form-tasks-${new Date().toISOString().slice(0, 10)}.csv`, buildRows(visibleTasks));
    toast.success(`Exported ${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'}`);
  };

  const exportAssignment = (assignmentId: string) => {
    const a = assignments.find(x => x.id === assignmentId);
    const list = tasks.filter(t => t.assignmentId === assignmentId);
    if (!list.length) { toast.info('This assignment has no tasks yet.'); return; }
    downloadCsv(`assignment-${slug(a?.title ?? assignmentId)}.csv`, buildRows(list));
    toast.success(`Exported ${list.length} task${list.length === 1 ? '' : 's'} for ${a?.title ?? 'assignment'}`);
  };

  const exportAllAssignments = () => {
    if (!tasks.length) { toast.info('No tasks to export.'); return; }
    downloadCsv(`all-assignments-${new Date().toISOString().slice(0, 10)}.csv`, buildRows(tasks));
    toast.success(`Exported ${tasks.length} tasks across ${assignments.length} assignments`);
  };

  /** Long-format answer export: one row per question per selected task. */
  const exportSelectedAnswers = () => {
    const list = tasks.filter(t => selectedTaskIds.includes(t.id));
    const submitted = list.filter(t => t.status === 'submitted');
    if (!submitted.length) { toast.info('Select at least one submitted task to export answers.'); return; }
    const rows: string[][] = [
      ['Assignment', 'Form', 'Staff', 'Locations', 'Occurrence', 'Submitted at', 'Review', 'Section', 'Question', 'Answer'],
    ];
    submitted.forEach(t => {
      const a = assignments.find(x => x.id === t.assignmentId);
      buildResponseGroups(t, a).forEach(g => g.rows.forEach(r => rows.push([
        a?.title ?? '—', a?.templateName ?? '—', t.staffName,
        staffLocations(t.staffId).join(' | '), t.occurrenceDate, t.submittedAt ?? '',
        t.reviewStatus ?? 'pending', g.title, r.label, r.value,
      ])));
    });
    downloadCsv(`form-answers-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Exported answers for ${submitted.length} submission${submitted.length === 1 ? '' : 's'}`);
  };

  const openInTasks = (staffName?: string) => {
    const params = new URLSearchParams({ module: 'forms', showCompleted: 'true' });
    if (staffName) params.set('search', staffName);
    navigate(`/my-tasks?${params.toString()}`);
  };

  const overall = summariseAssignment(scopedTasks, now);

  const remindOutstanding = () => {
    const ids = visibleTasks
      .filter(t => ['not_started', 'in_progress', 'overdue'].includes(deriveStatus(t, now)))
      .map(t => t.id);
    if (!ids.length) { toast.info('Nothing outstanding to remind.'); return; }
    formDeliveryStore.sendReminder(ids);
    toast.success(`Reminder sent to ${ids.length} outstanding task${ids.length === 1 ? '' : 's'}`);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Assign & Track</h2>
          <p className="text-sm text-muted-foreground">Send forms to staff once-off or on a recurring schedule and follow submission status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openInTasks()}>
            <ListChecks size={14} className="mr-1.5" /> Open in Tasks
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download size={14} className="mr-1.5" /> Export <ChevronDown size={13} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
              <DropdownMenuItem onClick={exportCurrentView}>
                Current view ({visibleTasks.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAllAssignments}>
                All assignments — single CSV ({tasks.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportSelectedAnswers} disabled={selectedTaskIds.length === 0}>
                Answer sets for selected ({selectedTaskIds.length})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Export by assignment</DropdownMenuLabel>
              {assignments.length === 0 && (
                <DropdownMenuItem disabled>No assignments</DropdownMenuItem>
              )}
              {assignments.map(a => (
                <DropdownMenuItem key={a.id} onClick={() => exportAssignment(a.id)}>
                  <span className="truncate">{a.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {tasks.filter(t => t.assignmentId === a.id).length}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={remindOutstanding}>
            <Bell size={14} className="mr-1.5" /> Remind outstanding
          </Button>
          <Button size="sm" onClick={() => setShowAssign(true)}>
            <Plus size={14} className="mr-1.5" /> Bulk assign forms
          </Button>

        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Assignments list */}
        <div className="w-[340px] shrink-0 border-r border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignments</p>
          </div>
          <ScrollArea className="flex-1">
            <button
              onClick={() => setSelectedId('all')}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50',
                selectedId === 'all' && 'bg-primary/5'
              )}
            >
              <p className="text-sm font-medium text-foreground">All assignments</p>
              <p className="text-xs text-muted-foreground">{tasks.length} tasks · {overall.completion}% complete</p>
            </button>
            {assignments.map(a => {
              const s = summariseAssignment(tasks.filter(t => t.assignmentId === a.id), now);
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50',
                    selectedId === a.id && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                      {a.mode === 'recurring' ? <Repeat size={10} /> : <CalendarClock size={10} />}
                      {a.mode === 'recurring' ? a.recurrence?.frequency : 'Once'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{a.templateName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={s.completion} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-muted-foreground tabular-nums">{s.counts.submitted}/{s.total}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users size={11} /> {a.staffIds.length}</span>
                    {s.counts.overdue > 0 && (
                      <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle size={11} /> {s.counts.overdue} overdue</span>
                    )}
                    {a.status === 'cancelled' && <span>Cancelled</span>}
                  </div>
                </button>
              );
            })}
            {assignments.length === 0 && (
              <p className="text-sm text-muted-foreground px-4 py-8 text-center">No assignments yet.</p>
            )}
          </ScrollArea>
        </div>

        {/* Tracking */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-6 py-3 border-b border-border flex items-center gap-2 flex-wrap">
            {(['all', 'not_started', 'in_progress', 'submitted', 'overdue'] as const).map(k => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  statusFilter === k ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                {k === 'all' ? 'All' : TASK_STATUS_LABELS[k]}
                <span className="ml-1.5 tabular-nums opacity-70">
                  {k === 'all' ? scopedTasks.length : statusCounts[k]}
                </span>
              </button>
            ))}
            <div className="relative ml-auto w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8 h-8" placeholder="Search staff" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {selectedId !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => { formDeliveryStore.deleteAssignment(selectedId); setSelectedId('all'); toast.success('Assignment deleted'); }}
              >
                <Trash2 size={14} className="mr-1.5" /> Delete
              </Button>
            )}
          </div>

          {/* Data filters */}
          <div className="px-6 py-2.5 border-b border-border flex items-center gap-2 flex-wrap bg-muted/20">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="All locations" /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All locations</SelectItem>
                {locationOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue placeholder="All forms" /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All forms</SelectItem>
                {templateOptions.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">From</span>
              <Input type="date" className="h-8 w-[150px] text-xs" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span className="text-xs text-muted-foreground">To</span>
              <Input type="date" className="h-8 w-[150px] text-xs" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {visibleTasks.length} of {scopedTasks.length} tasks
            </span>
            {filtersActive && (
              <Button variant="ghost" size="sm" className="h-8 ml-auto" onClick={clearFilters}>
                <FilterX size={13} className="mr-1.5" /> Clear filters
              </Button>
            )}
          </div>

          {selectedTaskIds.length > 0 && (
            <div className="px-6 py-2 border-b border-border bg-primary/5 flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">{selectedTaskIds.length} selected</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportSelectedAnswers}>
                <Download size={12} className="mr-1.5" /> Export answer sets
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { formDeliveryStore.sendReminder(selectedTaskIds); toast.success(`Reminder sent to ${selectedTaskIds.length} task(s)`); }}
              >
                <Bell size={12} className="mr-1.5" /> Remind selected
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSelectedTaskIds([])}>
                Clear selection
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 backdrop-blur">
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="pl-6 pr-2 py-2.5 w-9">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                  </th>
                  <SortHeader label="Staff" sortId="staff" className="px-3" />
                  <SortHeader label="Location" sortId="location" className="px-3" />
                  <SortHeader label="Form" sortId="form" className="px-3" />
                  <SortHeader label="Occurrence" sortId="occurrence" className="px-3" />
                  <SortHeader label="Due" sortId="due" className="px-3" />
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Submitted</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map(t => {
                  const status = deriveStatus(t, now);
                  const assignment = assignments.find(a => a.id === t.assignmentId);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() => setDetailTaskId(t.id)}
                    >
                      <td className="pl-6 pr-2 py-2.5" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedTaskIds.includes(t.id)}
                          onCheckedChange={() => toggleSelect(t.id)}
                          aria-label={`Select ${t.staffName}`}
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        <button className="text-primary hover:underline" onClick={e => { e.stopPropagation(); setDetailTaskId(t.id); }}>
                          {t.staffName}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[180px]">
                        {staffLocations(t.staffId).join(', ') || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{assignment?.templateName ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{fmtDate(t.occurrenceDate)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{fmtDateTime(t.dueAt)}</td>
                      <td className="px-3 py-2.5">
                        <Badge className={cn('gap-1 text-[11px] font-medium', STATUS_STYLES[status])}>
                          {STATUS_ICONS[status]} {TASK_STATUS_LABELS[status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {t.submittedAt ? fmtDateTime(t.submittedAt) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setDetailTaskId(t.id)}>
                          <Eye size={13} className="mr-1" /> View
                        </Button>
                        <Button variant="ghost" size="sm" title="Open in Tasks" onClick={() => openInTasks(t.staffName)}>
                          <ExternalLink size={13} className="mr-1" /> Task
                        </Button>
                        {status !== 'submitted' && status !== 'cancelled' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { formDeliveryStore.sendReminder([t.id]); toast.success(`Reminder sent to ${t.staffName}`); }}
                            >
                              <Bell size={13} className="mr-1" /> Remind
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { formDeliveryStore.setTaskStatus(t.id, 'submitted'); toast.success('Marked as submitted'); }}
                            >
                              <CheckCircle2 size={13} className="mr-1" /> Mark done
                            </Button>
                          </>
                        )}
                        {t.remindersSent > 0 && (
                          <span className="ml-1 text-[11px] text-muted-foreground">{t.remindersSent} reminder{t.remindersSent === 1 ? '' : 's'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {visibleTasks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      No tasks match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </div>

      <AssignFormPanel open={showAssign} onClose={() => setShowAssign(false)} />

      <TaskDetailPanel
        open={!!detailTaskId}
        task={tasks.find(t => t.id === detailTaskId) ?? null}
        assignment={assignments.find(a => a.id === tasks.find(t => t.id === detailTaskId)?.assignmentId)}
        siblingTasks={(() => {
          const current = tasks.find(t => t.id === detailTaskId);
          return current ? tasks.filter(t => t.assignmentId === current.assignmentId) : [];
        })()}
        onSelectTask={setDetailTaskId}
        onClose={() => setDetailTaskId(null)}
      />
    </div>
  );
};

export default StaffAssignmentsPage;
