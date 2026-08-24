import { useMemo } from 'react';
import {
  FileText, CheckCircle2, Bell, Clock, CalendarClock, User, AlertTriangle,
  CircleDashed, XCircle, Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  formDeliveryStore,
  deriveStatus,
  TASK_STATUS_LABELS,
  type RecipientTask,
  type StaffFormAssignment,
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

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Deterministic sample answers so a submitted task always renders a readable
 * record. Replaced by real captured responses once submissions are persisted.
 */
function buildResponses(task: RecipientTask, assignment?: StaffFormAssignment) {
  const seedNum = task.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = <T,>(arr: T[], offset = 0) => arr[(seedNum + offset) % arr.length];
  return [
    { label: 'Completed by', value: task.staffName },
    { label: 'Location', value: pick(['Riverside Site', 'Northgate Site', 'Central Site']) },
    { label: 'Shift', value: pick(['Morning (6:00 AM - 2:00 PM)', 'Afternoon (2:00 PM - 10:00 PM)', 'Night (10:00 PM - 6:00 AM)'], 3) },
    { label: 'All checks passed?', value: pick(['Yes', 'Yes', 'No — see notes'], 5) },
    { label: 'Issues identified', value: pick(['None', 'Minor — logged for follow up', 'None'], 7) },
    { label: 'Notes', value: pick(['Everything in order at handover.', 'Reported to supervisor on shift.', 'No exceptions to record.'], 11) },
    { label: 'Acknowledgement', value: `Signed electronically by ${task.staffName}` },
  ].concat(assignment ? [{ label: 'Form version', value: `${assignment.templateName} · v1.0` }] : []);
}

interface Props {
  task: RecipientTask | null;
  assignment?: StaffFormAssignment;
  open: boolean;
  onClose: () => void;
}

const TaskDetailPanel = ({ task, assignment, open, onClose }: Props) => {
  const responses = useMemo(() => (task ? buildResponses(task, assignment) : []), [task, assignment]);
  if (!task) return null;

  const status = deriveStatus(task);
  const isSubmitted = status === 'submitted';

  const timeline = [
    { label: 'Assigned', at: assignment?.createdAt, icon: <CalendarClock size={13} /> },
    ...(task.remindersSent
      ? [{ label: `${task.remindersSent} reminder${task.remindersSent === 1 ? '' : 's'} sent`, at: undefined, icon: <Bell size={13} /> }]
      : []),
    { label: 'Due', at: task.dueAt, icon: <Clock size={13} /> },
    ...(task.submittedAt ? [{ label: 'Submitted', at: task.submittedAt, icon: <CheckCircle2 size={13} /> }] : []),
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={task.staffName}
      description={`${assignment?.templateName ?? 'Form'} · ${fmtDate(task.occurrenceDate)}`}
      icon={FileText}
      size="lg"
      actions={
        isSubmitted
          ? [
              { label: 'Close', onClick: onClose, variant: 'outlined' },
              {
                label: 'Export record',
                variant: 'primary',
                icon: <Download size={14} />,
                onClick: () => toast.success('Submission record exported'),
              },
            ]
          : [
              { label: 'Close', onClick: onClose, variant: 'outlined' },
              {
                label: 'Send reminder',
                variant: 'outlined',
                icon: <Bell size={14} />,
                onClick: () => { formDeliveryStore.sendReminder([task.id]); toast.success(`Reminder sent to ${task.staffName}`); },
              },
              {
                label: 'Mark submitted',
                variant: 'primary',
                icon: <CheckCircle2 size={14} />,
                onClick: () => { formDeliveryStore.setTaskStatus(task.id, 'submitted'); toast.success('Marked as submitted'); },
              },
            ]
      }
    >
      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User size={14} className="text-muted-foreground" /> {task.staffName}
          </div>
          <Badge className={cn('gap-1 text-[11px] font-medium', STATUS_STYLES[status])}>
            {STATUS_ICONS[status]} {TASK_STATUS_LABELS[status]}
          </Badge>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Form</p>
            <p className="text-foreground">{assignment?.templateName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Assignment</p>
            <p className="text-foreground">{assignment?.title ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Occurrence</p>
            <p className="text-foreground">{fmtDate(task.occurrenceDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due</p>
            <p className="text-foreground">{fmtDateTime(task.dueAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Submitted</p>
            <p className="text-foreground">{task.submittedAt ? fmtDateTime(task.submittedAt) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Submission ID</p>
            <p className="text-foreground font-mono text-xs">{task.submissionId ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Responses */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Submitted responses</p>
        </div>
        {isSubmitted ? (
          <div className="divide-y divide-border">
            {responses.map(r => (
              <div key={r.label} className="px-4 py-2.5 grid grid-cols-[180px_1fr] gap-3 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <CircleDashed size={20} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No responses yet — this form has not been submitted by {task.staffName}.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => { formDeliveryStore.sendReminder([task.id]); toast.success(`Reminder sent to ${task.staffName}`); }}
            >
              <Bell size={13} className="mr-1.5" /> Send reminder
            </Button>
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Activity</p>
        </div>
        <div className="p-4 space-y-3">
          {timeline.map((e, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 text-muted-foreground">{e.icon}</span>
              <div>
                <p className="text-foreground">{e.label}</p>
                {e.at && <p className="text-xs text-muted-foreground">{fmtDateTime(e.at)}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PrimaryOffCanvas>
  );
};

export default TaskDetailPanel;
