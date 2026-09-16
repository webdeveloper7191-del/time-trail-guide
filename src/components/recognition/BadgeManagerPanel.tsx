import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Award, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  BADGE_CATEGORIES,
  useRecognitionBadges,
  recognitionBadgeStore,
  type BadgeAudience,
  type RecognitionBadge,
} from '@/lib/recognitionBadgeStore';

const audienceLabels: Record<BadgeAudience, string> = {
  everyone: 'Everyone',
  managers: 'Managers and above',
  admins: 'Admins only',
};

const blank = (): RecognitionBadge => ({
  id: `badge-${Date.now()}`,
  label: '',
  emoji: '🏅',
  description: '',
  category: BADGE_CATEGORIES[0],
  active: true,
  awardableBy: 'everyone',
});

export function BadgeManagerPanel() {
  const { badges, limit, activeCount } = useRecognitionBadges();
  const [editing, setEditing] = useState<RecognitionBadge | null>(null);

  const atCap = limit !== null && activeCount >= limit;

  const handleToggle = (b: RecognitionBadge) => {
    if (!b.active && atCap) {
      toast.error(`Your plan allows ${limit} active badges. Deactivate one first or upgrade for unlimited badges.`);
      return;
    }
    recognitionBadgeStore.toggleActive(b.id);
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.label.trim()) {
      toast.error('Give the badge a name.');
      return;
    }
    const isNew = !badges.some((b) => b.id === editing.id);
    if (isNew && editing.active && atCap) {
      toast.error(`Your plan allows ${limit} active badges.`);
      return;
    }
    recognitionBadgeStore.save({ ...editing, label: editing.label.trim() });
    toast.success(isNew ? 'Badge created' : 'Badge updated');
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Badges
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} active{limit === null ? ' · unlimited on your plan' : ` of ${limit} allowed on your plan`}
          </p>
        </div>
        <Button onClick={() => setEditing(blank())}>
          <Plus className="h-4 w-4 mr-2" />
          New badge
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Badge</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Who can award</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{b.emoji}</span>
                      <div>
                        <p className="font-medium">{b.label}</p>
                        {b.description && <p className="text-xs text-muted-foreground">{b.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{b.category}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{audienceLabels[b.awardableBy]}</TableCell>
                  <TableCell>
                    <Switch checked={b.active} onCheckedChange={() => handleToggle(b)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditing({ ...b })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={b.system}
                      onClick={() => { recognitionBadgeStore.remove(b.id); toast.success('Badge removed'); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PrimaryOffCanvas
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && badges.some((b) => b.id === editing.id) ? 'Edit badge' : 'New badge'}
        description="Badges appear when someone gives praise."
        icon={Award}
        size="lg"
        actions={[
          { label: 'Cancel', variant: 'outlined' as const, onClick: () => setEditing(null) },
          { label: 'Save badge', variant: 'primary' as const, onClick: handleSave },
        ]}
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} maxLength={4} />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. Safety Champion" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="When should this badge be given?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BADGE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Who can award it</Label>
                <Select value={editing.awardableBy} onValueChange={(v) => setEditing({ ...editing, awardableBy: v as BadgeAudience })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(audienceLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Only active badges can be given.</p>
              </div>
              <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
            </div>
          </div>
        )}
      </PrimaryOffCanvas>
    </div>
  );
}
