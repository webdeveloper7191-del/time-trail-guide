import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  performanceTaxonomyStore,
  TaxonomyKey,
  TaxonomyMeta,
  TaxonomyOption,
} from '@/lib/performanceTaxonomyStore';

interface Props {
  meta: TaxonomyMeta;
  options: TaxonomyOption[];
}

const blank = (): Omit<TaxonomyOption, 'id'> => ({ label: '', description: '', tone: '', value: undefined, isActive: true, isSystem: false });

export function TaxonomyListEditor({ meta, options }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<TaxonomyOption, 'id'> & { id?: string }>(blank());
  const [adding, setAdding] = useState(false);

  const startAdd = () => {
    setDraft(blank());
    setEditingId(null);
    setAdding(true);
  };

  const startEdit = (o: TaxonomyOption) => {
    setDraft({ ...o });
    setEditingId(o.id);
    setAdding(false);
  };

  const cancel = () => {
    setAdding(false);
    setEditingId(null);
    setDraft(blank());
  };

  const save = () => {
    if (!draft.label.trim()) {
      toast.error('Give this option a name');
      return;
    }
    performanceTaxonomyStore.saveOption(meta.key, { ...draft, label: draft.label.trim() });
    toast.success(editingId ? 'Option updated' : 'Option added');
    cancel();
  };

  const remove = (id: string) => {
    try {
      performanceTaxonomyStore.deleteOption(meta.key, id);
      toast.success('Option deleted');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const editorRow = (
    <TableRow className="bg-muted/40">
      <TableCell colSpan={meta.valueLabel ? 6 : 5}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Customer service" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Optional helper text" />
          </div>
          {meta.valueLabel && (
            <div className="space-y-1.5">
              <Label className="text-xs">{meta.valueLabel}</Label>
              <Input
                type="number"
                value={draft.value ?? ''}
                onChange={e => setDraft({ ...draft, value: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
          )}
          {meta.toneEnabled && (
            <div className="space-y-1.5">
              <Label className="text-xs">Colour token</Label>
              <Input value={draft.tone ?? ''} onChange={e => setDraft({ ...draft, tone: e.target.value })} placeholder="e.g. emerald, amber, destructive" />
            </div>
          )}
          <div className="flex items-center gap-2 pt-5">
            <Switch checked={draft.isActive} onCheckedChange={v => setDraft({ ...draft, isActive: v })} id={`${meta.key}-active`} />
            <Label htmlFor={`${meta.key}-active`} className="text-xs">Available for selection</Label>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={cancel}><X className="h-3.5 w-3.5 mr-1.5" /> Cancel</Button>
          <Button size="sm" onClick={save}><Check className="h-3.5 w-3.5 mr-1.5" /> Save</Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{meta.label}</h3>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <Button size="sm" onClick={startAdd}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add option</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Option</TableHead>
              {meta.valueLabel && <TableHead className="w-20">{meta.valueLabel}</TableHead>}
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-24">Source</TableHead>
              <TableHead className="w-20">Order</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adding && editorRow}
            {options.map(o =>
              editingId === o.id ? (
                <React.Fragment key={o.id}>{editorRow}</React.Fragment>
              ) : (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.label}</div>
                    {o.description && <div className="text-xs text-muted-foreground">{o.description}</div>}
                  </TableCell>
                  {meta.valueLabel && <TableCell className="text-sm">{o.value ?? '—'}</TableCell>}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => performanceTaxonomyStore.toggleOption(meta.key, o.id)}
                      aria-label={o.isActive ? 'Deactivate option' : 'Activate option'}
                    >
                      <Badge variant={o.isActive ? 'outline' : 'destructive'}>{o.isActive ? 'Active' : 'Hidden'}</Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{o.isSystem ? 'System' : 'Custom'}</TableCell>
                  <TableCell>
                    <div className="flex">
                      <Button size="icon" variant="ghost" aria-label="Move up" onClick={() => performanceTaxonomyStore.reorderOption(meta.key, o.id, -1)}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Move down" onClick={() => performanceTaxonomyStore.reorderOption(meta.key, o.id, 1)}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" aria-label="Edit option" onClick={() => startEdit(o)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete option" onClick={() => remove(o.id)} disabled={o.isSystem}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
            {!options.length && !adding && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No options yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
