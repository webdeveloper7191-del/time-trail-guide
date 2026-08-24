import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Settings2, RotateCcw, Lock } from 'lucide-react';
import { UnifiedTask } from '@/types/unifiedTasks';
import { UnifiedTaskCard } from '@/components/tasks/UnifiedTaskCard';
import { BoardColumnsDialog } from '@/components/tasks/BoardColumnsDialog';
import {
  BoardGroupBy, BoardSwimlaneBy, GROUP_BY_LABELS, SWIMLANE_LABELS, TONE_CLASSES,
  columnKeyFor, columnsFor, isGroupingEditable, swimlaneKeyFor, swimlanesFor,
  taskBoardStore, useTaskBoard,
} from '@/lib/taskBoardStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskKanbanBoardProps {
  tasks: UnifiedTask[];
  onTaskClick: (task: UnifiedTask) => void;
}

const GROUPINGS: BoardGroupBy[] = ['status', 'priority', 'module', 'due', 'custom'];
const SWIMLANES: BoardSwimlaneBy[] = ['none', 'status', 'priority', 'module', 'due'];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ tasks, onTaskClick }) => {
  const board = useTaskBoard();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns = useMemo(
    () => columnsFor(board.groupBy, board.customColumns),
    [board.groupBy, board.customColumns],
  );

  // The swimlane axis can never duplicate the column axis.
  const swimlaneBy: BoardSwimlaneBy =
    board.swimlaneBy !== 'none' && board.swimlaneBy === (board.groupBy as string)
      ? 'none'
      : board.swimlaneBy;

  const lanes = useMemo(() => {
    if (swimlaneBy === 'none') return [{ id: '__all__', title: '', tone: 'neutral' as const }];
    return swimlanesFor(swimlaneBy);
  }, [swimlaneBy]);

  /** lane id -> column id -> tasks */
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, UnifiedTask[]>> = {};
    lanes.forEach(lane => {
      map[lane.id] = {};
      columns.forEach(c => { map[lane.id][c.id] = []; });
    });
    tasks.forEach(task => {
      const laneId = swimlaneBy === 'none' ? '__all__' : swimlaneKeyFor(task, swimlaneBy);
      const key = columnKeyFor(task, board.groupBy, board.overrides, columns);
      ((map[laneId] ??= {})[key] ??= []).push(task);
    });
    return map;
  }, [tasks, columns, lanes, swimlaneBy, board.groupBy, board.overrides]);

  const editable = isGroupingEditable(board.groupBy);

  const handleDrop = (columnId: string) => {
    setDragOverColumn(null);
    if (!dragTaskId) return;
    const taskId = dragTaskId;
    setDragTaskId(null);
    if (!editable) {
      toast.info(`Cards can't be moved when grouped by ${GROUP_BY_LABELS[board.groupBy].toLowerCase()}.`);
      return;
    }
    const current = columnKeyFor(
      tasks.find(t => t.id === taskId) as UnifiedTask,
      board.groupBy, board.overrides, columns,
    );
    if (current === columnId) return;
    taskBoardStore.moveTask(taskId, board.groupBy, columnId);
    const title = columns.find(c => c.id === columnId)?.title ?? columnId;
    toast.success(`Moved to ${title}`);
  };

  return (
    <div className="space-y-4">
      {/* Board toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Columns by</span>
        <Select value={board.groupBy} onValueChange={v => taskBoardStore.setGroupBy(v as BoardGroupBy)}>
          <SelectTrigger className="w-[190px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GROUPINGS.map(g => (
              <SelectItem key={g} value={g}>{GROUP_BY_LABELS[g]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {board.groupBy === 'custom' && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-4 w-4" /> Edit columns
          </Button>
        )}

        <span className="text-sm text-muted-foreground">Swimlanes by</span>
        <Select
          value={swimlaneBy}
          onValueChange={v => taskBoardStore.setSwimlaneBy(v as BoardSwimlaneBy)}
        >
          <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SWIMLANES.filter(s => s === 'none' || s !== (board.groupBy as string)).map(s => (
              <SelectItem key={s} value={s}>{SWIMLANE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!editable && (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Lock className="h-3 w-3" /> Read-only grouping
          </Badge>
        )}

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => { taskBoardStore.resetOverrides(); toast.success('Board changes reset'); }}
          >
            <RotateCcw className="h-4 w-4" /> Reset board
          </Button>
        </div>
      </div>

      {/* Columns (optionally split into swimlanes) */}
      <div className="space-y-5">
        {lanes.map(lane => {
          const laneTasks = grouped[lane.id] ?? {};
          const laneCount = Object.values(laneTasks).reduce((n, arr) => n + arr.length, 0);
          if (swimlaneBy !== 'none' && laneCount === 0) return null;
          return (
            <div key={lane.id} className="space-y-2">
              {swimlaneBy !== 'none' && (
                <div className="flex items-center gap-2 border-l-4 pl-2 border-border">
                  <span className={cn('h-2.5 w-2.5 rounded-full', TONE_CLASSES[lane.tone])} />
                  <h3 className="text-sm font-semibold">{lane.title}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5">{laneCount}</Badge>
                </div>
              )}

              <div className="overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-max">
                  {columns.map(col => {
                    const items = laneTasks[col.id] ?? [];
                    const overLimit = col.wipLimit !== undefined && items.length > col.wipLimit;
                    const dropId = `${lane.id}::${col.id}`;
                    return (
                      <div
                        key={col.id}
                        onDragOver={e => { e.preventDefault(); setDragOverColumn(dropId); }}
                        onDragLeave={() => setDragOverColumn(prev => (prev === dropId ? null : prev))}
                        onDrop={() => handleDrop(col.id)}
                        className={cn(
                          'w-[300px] shrink-0 rounded-lg border bg-muted/30 p-3 transition-colors',
                          dragOverColumn === dropId && editable && 'border-primary bg-primary/5',
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', TONE_CLASSES[col.tone])} />
                            <h3 className="text-sm font-semibold truncate">{col.title}</h3>
                          </div>
                          <Badge variant={overLimit ? 'destructive' : 'secondary'} className="h-5 px-1.5">
                            {col.wipLimit !== undefined ? `${items.length}/${col.wipLimit}` : items.length}
                          </Badge>
                        </div>

                        <div className="space-y-3 min-h-[120px]">
                          {items.length === 0 ? (
                            <div className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
                              {editable ? 'Drop tasks here' : 'No tasks'}
                            </div>
                          ) : (
                            items.map(task => (
                              <div
                                key={task.id}
                                draggable={editable}
                                onDragStart={() => setDragTaskId(task.id)}
                                onDragEnd={() => { setDragTaskId(null); setDragOverColumn(null); }}
                                className={cn(editable && 'cursor-grab active:cursor-grabbing', dragTaskId === task.id && 'opacity-50')}
                              >
                                <UnifiedTaskCard task={task} onClick={onTaskClick} compact />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BoardColumnsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        columns={board.customColumns}
        onSave={cols => taskBoardStore.setCustomColumns(cols)}
      />
    </div>
  );
};

export default TaskKanbanBoard;
