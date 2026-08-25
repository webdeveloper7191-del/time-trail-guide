import React, { useEffect, useState } from 'react';
import { Star, Plus, Trash2 } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { performanceConfigStore, RatingScale, RatingScalePoint } from '@/lib/performanceConfigStore';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  scale?: RatingScale | null;
}

const blank = (): Omit<RatingScale, 'id'> => ({
  name: '',
  description: '',
  isDefault: false,
  isActive: true,
  appliesTo: 'reviews',
  points: [
    { value: 1, label: '' },
    { value: 2, label: '' },
    { value: 3, label: '' },
  ],
});

export function RatingScaleDrawer({ open, onClose, scale }: Props) {
  const [draft, setDraft] = useState<Omit<RatingScale, 'id'> & { id?: string }>(blank());

  useEffect(() => {
    if (open) setDraft(scale ? { ...scale } : blank());
  }, [open, scale]);

  const setPoint = (index: number, patch: Partial<RatingScalePoint>) => {
    setDraft(d => ({ ...d, points: d.points.map((p, i) => (i === index ? { ...p, ...patch } : p)) }));
  };

  const addPoint = () => {
    setDraft(d => ({ ...d, points: [...d.points, { value: d.points.length + 1, label: '' }] }));
  };

  const removePoint = (index: number) => {
    setDraft(d => ({
      ...d,
      points: d.points.filter((_, i) => i !== index).map((p, i) => ({ ...p, value: i + 1 })),
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) return toast.error('Give the scale a name');
    if (draft.points.length < 2) return toast.error('A scale needs at least two points');
    if (draft.points.some(p => !p.label.trim())) return toast.error('Every point needs a label');
    performanceConfigStore.saveRatingScale(draft);
    toast.success(draft.id ? 'Rating scale updated' : 'Rating scale created');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title={draft.id ? 'Edit rating scale' : 'New rating scale'}
      description="Define the levels reviewers can pick when scoring competencies."
      icon={Star}
      size="lg"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save scale', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Scale name</Label>
          <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. 5-point performance scale" />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={2} value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label>Applies to</Label>
          <Select value={draft.appliesTo} onValueChange={(v: RatingScale['appliesTo']) => setDraft(d => ({ ...d, appliesTo: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="reviews">Reviews</SelectItem>
              <SelectItem value="goals">Goals</SelectItem>
              <SelectItem value="both">Reviews and goals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Scale points</Label>
            <Button size="sm" variant="outline" onClick={addPoint}><Plus className="h-3.5 w-3.5 mr-1" /> Add point</Button>
          </div>
          {draft.points.map((p, i) => (
            <div key={i} className="grid grid-cols-[40px_1fr_1.4fr_36px] gap-2 items-center">
              <div className="text-sm font-medium text-muted-foreground text-center">{p.value}</div>
              <Input value={p.label} onChange={e => setPoint(i, { label: e.target.value })} placeholder="Label" />
              <Input value={p.description ?? ''} onChange={e => setPoint(i, { description: e.target.value })} placeholder="What this level means" />
              <Button size="icon" variant="ghost" onClick={() => removePoint(i)} disabled={draft.points.length <= 2} aria-label="Remove point">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Default scale</p>
            <p className="text-xs text-muted-foreground">New review cycles start with this scale selected.</p>
          </div>
          <Switch checked={draft.isDefault} onCheckedChange={v => setDraft(d => ({ ...d, isDefault: v }))} />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">Inactive scales stay on historic cycles but can't be selected.</p>
          </div>
          <Switch checked={draft.isActive} onCheckedChange={v => setDraft(d => ({ ...d, isActive: v }))} />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
