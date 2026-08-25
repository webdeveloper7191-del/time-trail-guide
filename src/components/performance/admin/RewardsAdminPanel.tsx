import React, { useState, useSyncExternalStore } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, Coins, Inbox, SlidersHorizontal, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  rewardsStore,
  RewardItem,
  EarningRule,
  rewardCategoryLabels,
  earningTriggerLabels,
  redemptionStatusLabels,
  pointsLiability,
} from '@/lib/rewardsStore';
import { RewardItemDrawer } from './RewardItemDrawer';
import { mockStaff } from '@/data/mockStaffData';
import { toast } from 'sonner';

function useRewards() {
  return useSyncExternalStore(
    cb => rewardsStore.subscribe(cb),
    () => rewardsStore.get(),
    () => rewardsStore.get(),
  );
}

const staffName = (id: string) => {
  const s = mockStaff.find(m => m.id === id);
  return s ? `${s.firstName} ${s.lastName}` : id;
};

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export function RewardsAdminPanel() {
  const state = useRewards();
  const [drawer, setDrawer] = useState<{ open: boolean; reward: RewardItem | null }>({ open: false, reward: null });

  const liability = pointsLiability(state);
  const pending = state.redemptions.filter(r => r.status === 'pending');

  const deleteReward = (id: string) => {
    try {
      rewardsStore.deleteReward(id);
      toast.success('Reward removed');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const setRule = (rule: EarningRule, patch: Partial<EarningRule>) => rewardsStore.saveEarningRule({ ...rule, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Active rewards</p>
          <p className="text-lg font-semibold">{state.catalogue.filter(r => r.isActive).length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Pending redemptions</p>
          <p className="text-lg font-semibold">{pending.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Points outstanding</p>
          <p className="text-lg font-semibold">{liability.points.toLocaleString()}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Estimated liability</p>
          <p className="text-lg font-semibold">
            {liability.value.toLocaleString('en-AU', { style: 'currency', currency: state.settings.currency, maximumFractionDigits: 0 })}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="catalogue">
        <TabsList>
          <TabsTrigger value="catalogue" className="gap-1.5"><Gift className="h-3.5 w-3.5" /> Reward catalogue</TabsTrigger>
          <TabsTrigger value="earning" className="gap-1.5"><Coins className="h-3.5 w-3.5" /> Points rules</TabsTrigger>
          <TabsTrigger value="redemptions" className="gap-1.5"><Inbox className="h-3.5 w-3.5" /> Redemptions{pending.length > 0 && <Badge variant="secondary" className="ml-1">{pending.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> Program settings</TabsTrigger>
        </TabsList>

        {/* Catalogue */}
        <TabsContent value="catalogue" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDrawer({ open: true, reward: null })}><Plus className="h-3.5 w-3.5 mr-1.5" /> New reward</Button>
          </div>
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-24">Cost</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Limit / year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.catalogue.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.emoji} {r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </TableCell>
                    <TableCell className="text-sm">{rewardCategoryLabels[r.category]}</TableCell>
                    <TableCell className="text-sm">{r.pointsCost} pts</TableCell>
                    <TableCell className="text-sm">{typeof r.stock === 'number' ? r.stock : 'Unlimited'}</TableCell>
                    <TableCell className="text-sm">{r.limitPerStaffPerYear ?? 'No limit'}</TableCell>
                    <TableCell className="space-x-1">
                      {r.requiresApproval && <Badge variant="secondary">Approval</Badge>}
                      <Badge variant={r.isActive ? 'outline' : 'destructive'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label="Edit reward" onClick={() => setDrawer({ open: true, reward: r })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete reward" onClick={() => deleteReward(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Earning rules */}
        <TabsContent value="earning" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            How staff earn points automatically. A monthly cap of 0 means unlimited.
          </p>
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When this happens</TableHead>
                  <TableHead className="w-32">Points</TableHead>
                  <TableHead className="w-40">Monthly cap</TableHead>
                  <TableHead className="w-28">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.earningRules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{earningTriggerLabels[rule.trigger]}</TableCell>
                    <TableCell>
                      <Input type="number" min={0} value={rule.points} className="h-8 w-24" onChange={e => setRule(rule, { points: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={0} value={rule.monthlyCap} className="h-8 w-28" onChange={e => setRule(rule, { monthlyCap: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={rule.isActive} onCheckedChange={v => setRule(rule, { isActive: v })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Redemptions */}
        <TabsContent value="redemptions" className="mt-4 space-y-3">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="w-24">Points</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.redemptions.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground py-6 text-center">No redemptions yet.</TableCell></TableRow>
                )}
                {state.redemptions.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{staffName(r.staffId)}</TableCell>
                    <TableCell className="text-sm">{r.rewardName}</TableCell>
                    <TableCell className="text-sm">{r.pointsCost}</TableCell>
                    <TableCell className="text-sm">{fmtDate(r.requestedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'declined' || r.status === 'cancelled' ? 'destructive' : r.status === 'pending' ? 'secondary' : 'outline'}>
                        {redemptionStatusLabels[r.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { rewardsStore.decideRedemption(r.id, 'approved'); toast.success('Redemption approved'); }}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { rewardsStore.decideRedemption(r.id, 'declined'); toast.success('Redemption declined, points refunded'); }}>
                            <X className="h-3.5 w-3.5 mr-1" /> Decline
                          </Button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => { rewardsStore.decideRedemption(r.id, 'fulfilled'); toast.success('Marked as fulfilled'); }}>
                          Mark fulfilled
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-4 space-y-3">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Rewards program enabled</p>
                <p className="text-xs text-muted-foreground">Turn the whole points and rewards program on or off for this tenant.</p>
              </div>
              <Switch checked={state.settings.programEnabled} onCheckedChange={v => rewardsStore.saveSettings({ programEnabled: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Approval required for all redemptions</p>
                <p className="text-xs text-muted-foreground">When off, only rewards flagged "needs approval" go to the queue.</p>
              </div>
              <Switch checked={state.settings.requireApprovalForRedemption} onCheckedChange={v => rewardsStore.saveSettings({ requireApprovalForRedemption: v })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manager allowance (points / month)</Label>
                <Input type="number" min={0} value={state.settings.managerMonthlyAllowance} onChange={e => rewardsStore.saveSettings({ managerMonthlyAllowance: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Peer allowance (points / month)</Label>
                <Input type="number" min={0} value={state.settings.peerMonthlyAllowance} onChange={e => rewardsStore.saveSettings({ peerMonthlyAllowance: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Point value ({state.settings.currency})</Label>
                <Input type="number" min={0} step={0.01} value={state.settings.pointValue} onChange={e => rewardsStore.saveSettings({ pointValue: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">Used to estimate the outstanding rewards liability.</p>
              </div>
              <div className="space-y-2">
                <Label>Points expiry (months)</Label>
                <Input type="number" min={0} value={state.settings.pointsExpiryMonths} onChange={e => rewardsStore.saveSettings({ pointsExpiryMonths: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">0 = points never expire.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <RewardItemDrawer open={drawer.open} reward={drawer.reward} onClose={() => setDrawer({ open: false, reward: null })} />
    </div>
  );
}
