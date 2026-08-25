import React, { useEffect, useState } from 'react';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { performanceConfigStore, Competency } from '@/lib/performanceConfigStore';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  competency?: Competency | null;
}

const blank = (): Omit<Competency, 'id'> => ({
  name: '',
  description: '',
  category: 'Core',
  weight: 10,
  anchors: [''],
  isActive: true,
});

export function CompetencyDrawer({ open, onClose, competency }: Props) {
  const [draft, setDraft] = useState<Omit<Competency, 'id'> & { id?: string }>(blank());

  useEffect(() => {
    if (open) setDraft(competency ? { ...competency } : blank());
  }, [open, competency]);

  const handleSave = () => {
    if (!draft.name.trim()) return toast.error('Give the competency a name');
    if (draft.weight < 0 || draft.weight > 100) return toast.error('Weight must be between 0 and 100');
    performanceConfigStore.saveCompetency({ ...draft, anchors: draft.anchors.filter(a => a.trim()) });
    toast.success(draft.id ? 'Competency updated' : 'Competency added');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title={draft.id ? 'Edit competency' : 'New competency'}
      description="Competencies are the criteria reviewers score in a review cycle."
      icon={ListChecks}
      size="lg"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save competency', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Quality of work" />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={2} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} placeholder="Core, Leadership…" />
          </div>
          <div className="space-y-2">
            <Label>Weight (%)</Label>
            <Input type="number" min={0} max={100} value={draft.weight} onChange={e => setDraft(d => ({ ...d, weight: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Behavioural anchors</Label>
              <p className="text-xs text-muted-foreground">Examples shown to reviewers to keep scoring consistent.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDraft(d => ({ ...d, anchors: [...d.anchors, ''] }))}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {draft.anchors.map((a, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={a}
                onChange={e => setDraft(d => ({ ...d, anchors: d.anchors.map((x, xi) => (xi === i ? e.target.value : x)) }))}
                placeholder="Observable behaviour"
              />
              <Button size="icon" variant="ghost" aria-label="Remove anchor" onClick={() => setDraft(d => ({ ...d, anchors: d.anchors.filter((_, xi) => xi !== i) }))}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">Inactive competencies can't be added to new cycles.</p>
          </div>
          <Switch checked={draft.isActive} onCheckedChange={v => setDraft(d => ({ ...d, isActive: v }))} />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
