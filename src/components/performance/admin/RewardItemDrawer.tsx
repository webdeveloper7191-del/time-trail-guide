import React, { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { rewardsStore, RewardItem, RewardCategory, rewardCategoryLabels } from '@/lib/rewardsStore';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  reward?: RewardItem | null;
}

const blank = (): Omit<RewardItem, 'id'> => ({
  name: '',
  description: '',
  emoji: '🎁',
  pointsCost: 100,
  category: 'voucher',
  requiresApproval: true,
  isActive: true,
});

export function RewardItemDrawer({ open, onClose, reward }: Props) {
  const [draft, setDraft] = useState<Omit<RewardItem, 'id'> & { id?: string }>(blank());

  useEffect(() => {
    if (open) setDraft(reward ? { ...reward } : blank());
  }, [open, reward]);

  const handleSave = () => {
    if (!draft.name.trim()) return toast.error('Give the reward a name');
    if (!draft.pointsCost || draft.pointsCost <= 0) return toast.error('Points cost must be greater than zero');
    rewardsStore.saveReward(draft);
    toast.success(draft.id ? 'Reward updated' : 'Reward added to the catalogue');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title={draft.id ? 'Edit reward' : 'New reward'}
      description="Rewards staff can redeem with the points they earn."
      icon={Gift}
      size="lg"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save reward', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div className="space-y-2">
            <Label>Icon</Label>
            <Input value={draft.emoji} maxLength={4} className="text-center text-lg" onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Reward name</Label>
            <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Coffee voucher" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={2} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="What the staff member actually receives" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={draft.category} onValueChange={(v: RewardCategory) => setDraft(d => ({ ...d, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(rewardCategoryLabels) as RewardCategory[]).map(c => (
                  <SelectItem key={c} value={c}>{rewardCategoryLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Points cost</Label>
            <Input type="number" min={1} value={draft.pointsCost} onChange={e => setDraft(d => ({ ...d, pointsCost: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Stock available</Label>
            <Input
              type="number"
              min={0}
              placeholder="Unlimited"
              value={draft.stock ?? ''}
              onChange={e => setDraft(d => ({ ...d, stock: e.target.value === '' ? undefined : Number(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">Leave blank for unlimited.</p>
          </div>
          <div className="space-y-2">
            <Label>Limit per person / year</Label>
            <Input
              type="number"
              min={0}
              placeholder="No limit"
              value={draft.limitPerStaffPerYear ?? ''}
              onChange={e => setDraft(d => ({ ...d, limitPerStaffPerYear: e.target.value === '' ? undefined : Number(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">Leave blank for no limit.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Needs approval</p>
            <p className="text-xs text-muted-foreground">Redemptions go to the approval queue before being fulfilled.</p>
          </div>
          <Switch checked={draft.requiresApproval} onCheckedChange={v => setDraft(d => ({ ...d, requiresApproval: v }))} />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">Inactive rewards stay in history but can't be redeemed.</p>
          </div>
          <Switch checked={draft.isActive} onCheckedChange={v => setDraft(d => ({ ...d, isActive: v }))} />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
