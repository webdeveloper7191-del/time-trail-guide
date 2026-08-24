import { useMemo } from 'react';
import {
  FileText, CheckCircle2, Bell, Clock, CalendarClock, User, AlertTriangle,
  CircleDashed, XCircle, Download, ListChecks,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  formDeliveryStore,
  deriveStatus,
  TASK_STATUS_LABELS,
  type RecipientTask,
  type StaffFormAssignment,
  type DerivedTaskStatus,
} from '@/lib/formDeliveryStore';
import { mockFormTemplates } from '@/data/mockFormData';
import type { FormField } from '@/types/forms';

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
 * Builds a full response set from the real template definition so every question
 * in the form renders with an answer. Falls back to a generic set when the
 * template can't be resolved. Answers are deterministic per task + field.
 */
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

interface AnswerRow {
  id: string;
  label: string;
  value: string;
  required?: boolean;
}
interface AnswerGroup {
  id: string;
  title: string;
  description?: string;
  rows: AnswerRow[];
}

function answerForField(field: FormField, task: RecipientTask): string {
  const seed = hash(task.id + field.id);
  const pick = <T,>(arr: T[]) => arr[seed % arr.length];
  const opts = field.options?.length ? field.options.map(o => o.label) : null;

  switch (field.type) {
    case 'checkbox':
      return seed % 7 === 0 ? 'No' : 'Yes';
    case 'radio':
    case 'dropdown':
    case 'multi_select':
      return opts ? pick(opts) : 'Yes';
    case 'number':
      return String((seed % 12) + 1);
    case 'datetime':
    case 'date':
      return fmtDate(task.occurrenceDate);
    case 'time':
      return pick(['7:15 AM', '9:00 AM', '1:30 PM', '5:45 PM']);
    case 'signature':
      return `Signed electronically by ${task.staffName}`;
    case 'photo_upload':
    case 'file_upload':
      return pick(['1 file attached', '2 files attached', 'No attachment']);
    case 'long_text':
      return pick([
        'Everything in order at handover.',
        'Minor issue logged and reported to the supervisor.',
        'No exceptions to record for this shift.',
      ]);
    case 'short_text':
      return pick([task.staffName, 'Completed as per procedure', 'N/A']);
    default:
      return pick(['Yes', 'Completed', 'N/A']);
  }
}

function buildResponseGroups(task: RecipientTask, assignment?: StaffFormAssignment): AnswerGroup[] {
  const template =
    mockFormTemplates.find(t => t.id === assignment?.templateId) ??
    mockFormTemplates.find(t => t.name === assignment?.templateName);

  if (!template || !template.fields?.length) {
    const seed = hash(task.id);
    const pick = <T,>(arr: T[], o = 0) => arr[(seed + o) % arr.length];
    return [
      {
        id: 'general',
        title: 'Responses',
        rows: [
          { id: 'r1', label: 'Completed by', value: task.staffName },
          { id: 'r2', label: 'Location', value: pick(['Riverside Site', 'Northgate Site', 'Central Site']) },
          { id: 'r3', label: 'All checks passed?', value: pick(['Yes', 'Yes', 'No — see notes'], 5) },
          { id: 'r4', label: 'Issues identified', value: pick(['None', 'Minor — logged for follow up'], 7) },
          { id: 'r5', label: 'Notes', value: pick(['Everything in order at handover.', 'No exceptions to record.'], 11) },
          { id: 'r6', label: 'Acknowledgement', value: `Signed electronically by ${task.staffName}` },
        ],
      },
    ];
  }

  const fields = [...template.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sections = [...(template.sections ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const groups: AnswerGroup[] = sections.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    rows: fields
      .filter(f => f.sectionId === s.id)
      .map(f => ({ id: f.id, label: f.label, value: answerForField(f, task), required: f.required })),
  }));

  const ungrouped = fields.filter(f => !f.sectionId || !sections.some(s => s.id === f.sectionId));
  if (ungrouped.length) {
    groups.push({
      id: 'ungrouped',
      title: sections.length ? 'Other questions' : 'Questions',
      rows: ungrouped.map(f => ({ id: f.id, label: f.label, value: answerForField(f, task), required: f.required })),
    });
  }

  return groups.filter(g => g.rows.length > 0);
}

interface Props {
  task: RecipientTask | null;
  assignment?: StaffFormAssignment;
  open: boolean;
  onClose: () => void;
}

const TaskDetailPanel = ({ task, assignment, open, onClose }: Props) => {
  const navigate = useNavigate();
  const groups = useMemo(() => (task ? buildResponseGroups(task, assignment) : []), [task, assignment]);
  const totalQuestions = groups.reduce((n, g) => n + g.rows.length, 0);
  if (!task) return null;

  const status = deriveStatus(task);
  const isSubmitted = status === 'submitted';

  const openInTasks = () => {
    const params = new URLSearchParams({ module: 'forms', showCompleted: 'true', search: task.staffName });
    navigate(`/my-tasks?${params.toString()}`);
  };

  const exportRecord = () => {
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows: string[][] = [
      ['Section', 'Question', 'Answer'],
      ...groups.flatMap(g => g.rows.map(r => [g.title, r.label, r.value])),
    ];
    const csv = rows.map(r => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${task.staffName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${task.occurrenceDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Submission record exported');
  };

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
              { label: 'Open in Tasks', variant: 'outlined', icon: <ListChecks size={14} />, onClick: openInTasks },
              {
                label: 'Export record',
                variant: 'primary',
                icon: <Download size={14} />,
                onClick: exportRecord,
              },
            ]
          : [
              { label: 'Close', onClick: onClose, variant: 'outlined' },
              { label: 'Open in Tasks', variant: 'outlined', icon: <ListChecks size={14} />, onClick: openInTasks },
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
          {isSubmitted && (
            <p className="text-xs text-muted-foreground">{totalQuestions} question{totalQuestions === 1 ? '' : 's'} answered</p>
          )}
        </div>
        {isSubmitted ? (
          <div className="divide-y divide-border">
            {groups.map(g => (
              <div key={g.id}>
                <div className="px-4 py-2 bg-muted/40 border-b border-border">
                  <p className="text-xs font-semibold text-foreground">{g.title}</p>
                  {g.description && <p className="text-[11px] text-muted-foreground">{g.description}</p>}
                </div>
                <div className="divide-y divide-border">
                  {g.rows.map(r => (
                    <div key={r.id} className="px-4 py-2.5 grid grid-cols-[minmax(180px,45%)_1fr] gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {r.label}
                        {r.required && <span className="text-destructive ml-0.5">*</span>}
                      </span>
                      <span className="text-foreground">{r.value}</span>
                    </div>
                  ))}
                </div>
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
