import { useState, useSyncExternalStore } from 'react';
import { rewardsStore, pointsBalance, redemptionStatusLabels } from '@/lib/rewardsStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import type { StaffMember } from '@/types/staff';
import { Coins, Gift, Download } from 'lucide-react';
import { toast } from 'sonner';
import { usePerformanceSettings } from '@/lib/performanceSettingsStore';

export function RewardsWallet({ currentUserId, staff }: { currentUserId: string; staff: StaffMember[] }) {
  const performanceSettings = usePerformanceSettings();
  const state = useSyncExternalStore(rewardsStore.subscribe, rewardsStore.get, rewardsStore.get);
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [points, setPoints] = useState(25);
  const [reason, setReason] = useState('');
  const history = state.ledger.filter(l => l.staffId === currentUserId);
  const requests = state.redemptions.filter(r => r.staffId === currentUserId);
  const act = (fn: () => void) => { try { fn(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Unable to save'); } };
  const exportHistory = () => {
    const csv = ['Date,Type,Points,Reason', ...history.map(l => [l.date, l.type, l.points, l.reason].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'my-reward-points.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-xl font-semibold flex gap-2 items-center"><Coins className="h-5 w-5 text-primary" />My rewards</h2><p className="text-sm text-muted-foreground">{pointsBalance(state, currentUserId).toLocaleString()} points available</p></div><Button onClick={() => setOpen(true)} disabled={!state.settings.programEnabled || !performanceSettings.recognition.employeesCanAwardPoints}><Gift className="h-4 w-4 mr-2" />Send points</Button></div>
    <p className="text-xs text-muted-foreground">Browser-only rewards. Catalogue requests require manual fulfilment; no gift cards, payments or emails are sent.</p>
    <Tabs defaultValue="catalogue"><TabsList className="flex flex-wrap h-auto"><TabsTrigger value="catalogue">Catalogue</TabsTrigger><TabsTrigger value="history">Points history</TabsTrigger><TabsTrigger value="requests">My redemptions</TabsTrigger></TabsList>
      <TabsContent value="catalogue"><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{state.catalogue.filter(r => r.isActive).map(r => <div key={r.id} className="border border-border rounded-lg p-4 space-y-3"><h3 className="font-medium">{r.emoji} {r.name}</h3><p className="text-sm text-muted-foreground">{r.description}</p><p className="text-xs text-muted-foreground">{r.stock === undefined ? 'Unlimited stock' : `${r.stock} remaining`}{r.limitPerStaffPerYear ? ` · ${r.limitPerStaffPerYear} per year` : ''}</p><div className="flex justify-between items-center"><Badge variant="secondary">{r.pointsCost} pts</Badge><Button size="sm" variant="outline" disabled={!state.settings.programEnabled || r.stock === 0 || pointsBalance(state, currentUserId) < r.pointsCost} onClick={() => act(() => { rewardsStore.requestRedemption(currentUserId, r.id); toast.success('Reward request saved in this browser'); })}>Request reward</Button></div></div>)}</div></TabsContent>
      <TabsContent value="history" className="space-y-3"><div className="flex justify-end"><Button size="sm" variant="outline" onClick={exportHistory}><Download className="h-4 w-4 mr-2" />Export history</Button></div>{history.length === 0 && <p className="text-sm text-muted-foreground">No points activity yet.</p>}{history.map(l => <div key={l.id} className="border-b border-border py-3 flex justify-between gap-4"><div><p className="text-sm font-medium">{l.reason}</p><p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleDateString('en-AU')} · {l.type}</p></div><span className="font-semibold whitespace-nowrap">{l.points > 0 ? '+' : ''}{l.points} pts</span></div>)}</TabsContent>
      <TabsContent value="requests">{requests.length === 0 && <p className="text-sm text-muted-foreground">No reward requests yet.</p>}{requests.map(r => <div key={r.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-3"><div><p className="text-sm font-medium">{r.rewardName} · {r.pointsCost} pts</p><p className="text-xs text-muted-foreground">{new Date(r.requestedAt).toLocaleDateString('en-AU')}{r.note && ` · ${r.note}`}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{redemptionStatusLabels[r.status]}</Badge>{r.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => act(() => { rewardsStore.decideRedemption(r.id, 'cancelled'); toast.success('Request cancelled and points refunded'); })}>Cancel request</Button>}</div></div>)}</TabsContent>
    </Tabs>
    <PrimaryOffCanvas open={open} onClose={() => setOpen(false)} title="Send points" icon={Gift} size="md"><div className="space-y-4"><div><Label>Colleague</Label><Select value={recipient} onValueChange={setRecipient}><SelectTrigger><SelectValue placeholder="Select colleague" /></SelectTrigger><SelectContent>{staff.filter(s => s.status === 'active' && s.id !== currentUserId).map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="send-points">Points</Label><Input id="send-points" type="number" min={1} step={1} value={points} onChange={e => setPoints(Number(e.target.value))} /></div><p className="text-xs text-muted-foreground">Peer allowance: {state.settings.peerMonthlyAllowance} points per month.</p><div><Label htmlFor="points-reason">Reason</Label><Textarea id="points-reason" value={reason} onChange={e => setReason(e.target.value)} /></div><Button disabled={!recipient || !reason.trim()} onClick={() => act(() => { rewardsStore.awardPoints(recipient, currentUserId, points, reason); setOpen(false); setReason(''); toast.success('Points saved'); })}>Send points</Button></div></PrimaryOffCanvas>
  </div>;
}