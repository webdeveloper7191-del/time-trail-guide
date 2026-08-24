import { useMemo, useState } from 'react';
import {
  Plus, Users, Repeat, CalendarClock, Bell, Search, Trash2, CheckCircle2,
  AlertTriangle, Clock, CircleDashed, XCircle, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AssignFormPanel from './AssignFormPanel';
import TaskDetailPanel from './TaskDetailPanel';
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

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

const StaffAssignmentsPage = () => {
  const { assignments, tasks } = useFormDelivery();
  const [showAssign, setShowAssign] = useState(false);
  const [selectedId, setSelectedId] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DerivedTaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  const now = new Date();

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
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedTasks, statusFilter, search]);

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

          <ScrollArea className="flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 backdrop-blur">
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-6 py-2.5">Staff</th>
                  <th className="px-3 py-2.5">Form</th>
                  <th className="px-3 py-2.5">Occurrence</th>
                  <th className="px-3 py-2.5">Due</th>
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
                      <td className="px-6 py-2.5 font-medium">
                        <button className="text-primary hover:underline" onClick={e => { e.stopPropagation(); setDetailTaskId(t.id); }}>
                          {t.staffName}
                        </button>
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
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
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
        onClose={() => setDetailTaskId(null)}
      />
    </div>
  );
};

export default StaffAssignmentsPage;
