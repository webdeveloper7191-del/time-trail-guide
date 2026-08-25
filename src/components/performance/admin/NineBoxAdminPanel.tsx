import React, { useState, useSyncExternalStore } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Pencil } from 'lucide-react';
import { performanceTaxonomyStore, NineBoxCell } from '@/lib/performanceTaxonomyStore';

function useTaxonomy() {
  return useSyncExternalStore(
    cb => performanceTaxonomyStore.subscribe(cb),
    () => performanceTaxonomyStore.get(),
    () => performanceTaxonomyStore.get(),
  );
}

const rows: NineBoxCell['potential'][] = ['high', 'medium', 'low'];
const cols: NineBoxCell['performance'][] = ['low', 'medium', 'high'];

export function NineBoxAdminPanel() {
  const state = useTaxonomy();
  const [editing, setEditing] = useState<NineBoxCell | null>(null);

  const save = () => {
    if (!editing) return;
    if (!editing.label.trim()) {
      toast.error('Give the box a label');
      return;
    }
    performanceTaxonomyStore.saveNineBoxCell({ ...editing, label: editing.label.trim() });
    toast.success('Talent box updated');
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">Talent grid boxes</h3>
        <p className="text-xs text-muted-foreground">
          Rename each of the nine boxes, change the guidance shown to managers and set the recommended actions for that segment.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-3 gap-2">
          {rows.map(pot =>
            cols.map(perf => {
              const cell = state.nineBox.find(c => c.performance === perf && c.potential === pot);
              if (!cell) return null;
              return (
                <Card key={cell.id} className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{cell.label}</div>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${cell.label}`} onClick={() => setEditing(cell)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{cell.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {cell.recommendations.map(r => (
                      <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground pt-1">
                    Perf {cell.performance} · Pot {cell.potential}
                  </div>
                </Card>
              );
            }),
          )}
        </div>

        <Card className="p-4 h-fit space-y-3">
          {editing ? (
            <>
              <div className="text-sm font-semibold">Edit box</div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Colour token</Label>
                <Input value={editing.tone} onChange={e => setEditing({ ...editing, tone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recommended actions (one per line)</Label>
                <Textarea
                  rows={4}
                  value={editing.recommendations.join('\n')}
                  onChange={e => setEditing({ ...editing, recommendations: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5 mr-1.5" /> Cancel</Button>
                <Button size="sm" onClick={save}><Check className="h-3.5 w-3.5 mr-1.5" /> Save</Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a box to rename it and adjust its guidance.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
