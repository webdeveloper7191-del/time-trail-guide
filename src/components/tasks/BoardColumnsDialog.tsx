import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { BoardColumn, TONE_CLASSES, TONE_OPTIONS } from '@/lib/taskBoardStore';
import { cn } from '@/lib/utils';

interface BoardColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: BoardColumn[];
  onSave: (columns: BoardColumn[]) => void;
}

const slug = (title: string) =>
  `col-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'column'}-${Math.random().toString(36).slice(2, 6)}`;

export const BoardColumnsDialog: React.FC<BoardColumnsDialogProps> = ({ open, onOpenChange, columns, onSave }) => {
  const [draft, setDraft] = useState<BoardColumn[]>(columns);

  useEffect(() => { if (open) setDraft(columns); }, [open, columns]);

  const update = (id: string, patch: Partial<BoardColumn>) =>
    setDraft(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));

  const move = (index: number, delta: number) => {
    const next = [...draft];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  const add = () => setDraft(prev => [...prev, { id: slug('new column'), title: 'New column', tone: 'neutral' }]);

  const save = () => {
    const cleaned = draft
      .map(c => ({ ...c, title: c.title.trim() || 'Untitled' }))
      .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
    if (cleaned.length === 0) return;
    onSave(cleaned);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom board columns</DialogTitle>
          <DialogDescription>
            Define your own workflow stages. Cards you drag into a custom column stay there until you move them again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {draft.map((col, i) => (
            <div key={col.id} className="flex items-end gap-2 rounded-md border p-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Column name</Label>
                <Input value={col.title} onChange={e => update(col.id, { title: e.target.value })} />
              </div>
              <div className="w-36 space-y-1">
                <Label className="text-xs text-muted-foreground">Colour</Label>
                <Select value={col.tone} onValueChange={v => update(col.id, { tone: v as BoardColumn['tone'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(tone => (
                      <SelectItem key={tone} value={tone}>
                        <span className="flex items-center gap-2">
                          <span className={cn('h-3 w-3 rounded-full', TONE_CLASSES[tone])} />
                          <span className="capitalize">{tone}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs text-muted-foreground">WIP limit</Label>
                <Input
                  type="number"
                  min={0}
                  value={col.wipLimit ?? ''}
                  placeholder="—"
                  onChange={e => update(col.id, { wipLimit: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="flex items-center gap-1 pb-0.5">
                <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === draft.length - 1} aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDraft(prev => prev.filter(c => c.id !== col.id))}
                  disabled={draft.length <= 1}
                  aria-label="Delete column"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={add} className="gap-2 self-start">
          <Plus className="h-4 w-4" /> Add column
        </Button>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save columns</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoardColumnsDialog;
