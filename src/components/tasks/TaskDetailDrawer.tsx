import React, { useEffect, useMemo, useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ClipboardList, ExternalLink, Calendar, MapPin, AlertTriangle, MessageSquare, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UnifiedTask, moduleColors, typeLabels } from '@/types/unifiedTasks';
import { taskBoardStore, useTaskBoard } from '@/lib/taskBoardStore';
import { mockStaff } from '@/data/mockStaffData';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


interface TaskDetailDrawerProps {
  task: UnifiedTask | null;
  open: boolean;
  onClose: () => void;
  /** Optional jump-through to the owning module. */
  onOpenInModule?: (task: UnifiedTask) => void;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const UNASSIGNED = '__unassigned__';

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task, open, onClose, onOpenInModule,
}) => {
  const staffOptions = useMemo(
    () => mockStaff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, position: s.position })),
    [],
  );

  const [form, setForm] = useState({
    title: '', description: '', status: 'open', priority: 'medium',
    assigneeId: UNASSIGNED, dueDate: '',
  });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? UNASSIGNED,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
  }, [task]);

  if (!task) return null;

  const dirty =
    form.title !== task.title ||
    form.description !== (task.description ?? '') ||
    form.status !== task.status ||
    form.priority !== task.priority ||
    form.assigneeId !== (task.assigneeId ?? UNASSIGNED) ||
    form.dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : '');

  const handleSave = () => {
    const assignee = staffOptions.find(s => s.id === form.assigneeId);
    taskBoardStore.updateTask(task.id, {
      title: form.title.trim() || task.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId === UNASSIGNED ? '' : form.assigneeId,
      assigneeName: form.assigneeId === UNASSIGNED ? '' : assignee?.name ?? '',
      dueDate: form.dueDate,
    });
    toast.success('Task updated');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={task.title}
      description={`${task.moduleLabel} • ${typeLabels[task.type] || task.type}`}
      icon={ClipboardList}
      size="lg"
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: 'Save changes', variant: 'primary', onClick: handleSave, disabled: !dirty },
      ]}
    >
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('text-xs', moduleColors[task.module])}>
          {task.moduleLabel}
        </Badge>
        <Badge className={cn('text-xs capitalize', priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        <Badge variant="secondary" className="text-xs capitalize">
          {String(task.status).replace('_', ' ')}
        </Badge>
        {task.isOverdue && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" /> Overdue
          </Badge>
        )}
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Due: {task.dueDate ? format(new Date(task.dueDate), 'd MMM yyyy') : 'No due date'}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{task.location || 'No location'}</span>
        </div>
        <div className="text-muted-foreground">
          Assigned to: <span className="text-foreground">{task.assigneeName || 'Unassigned'}</span>
        </div>
        <div className="text-muted-foreground">
          Updated: <span className="text-foreground">{format(new Date(task.updatedAt), 'd MMM yyyy')}</span>
        </div>
      </div>

      {/* Edit form */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Edit task</h4>

        <div className="space-y-1.5">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-desc">Description</Label>
          <Textarea
            id="task-desc"
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Priority / severity</Label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned staff</Label>
            <Select value={form.assigneeId} onValueChange={v => setForm(f => ({ ...f, assigneeId: v }))}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {staffOptions.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {s.position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {onOpenInModule && (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => onOpenInModule(task)}>
          <ExternalLink className="h-4 w-4" /> Open in {task.moduleLabel}
        </Button>
      )}
    </PrimaryOffCanvas>
  );
};

export default TaskDetailDrawer;
