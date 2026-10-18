import { useState } from 'react';
import { recognitionWorkflowStore as store, useRecognitionWorkflow, type RecognitionValue, type ValueNomination } from '@/lib/recognitionWorkflowStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Plus, Pencil, Check, X, Award } from 'lucide-react';
import type { StaffMember } from '@/types/staff';
import { toast } from 'sonner';

export function RecognitionManagement({ currentUserId, staff, manage = false }: { currentUserId: string; staff: StaffMember[]; manage?: boolean }) {
  const state = useRecognitionWorkflow();
  const [compose, setCompose] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [valueId, setValueId] = useState('');
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState('mine');
  const [editing, setEditing] = useState<RecognitionValue | null>(null);
  const [review, setReview] = useState<ValueNomination | null>(null);
  const [note, setNote] = useState('');
  const name = (id: string) => { const s = staff.find(s => s.id === id); return s ? `${s.firstName} ${s.lastName}` : id; };
  const act = (fn: () => void) => { try { fn(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Unable to save'); } };
  const canReview = state.approverIds.includes(currentUserId);
  const rows = state.nominations.filter(n => filter === 'mine' ? n.fromStaffId === currentUserId || n.toStaffId === currentUserId : filter === 'pending' ? n.status === 'pending' : true);
  const decide = (status: 'approved' | 'declined') => act(() => { if (!review) return; store.decide(review.id, currentUserId, status, note); setReview(null); toast.success(status === 'approved' ? 'Recognition approved and published' : 'Recognition declined'); });
  return <div className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3 items-center"><h2 className="text-xl font-semibold">Value-based recognition</h2><Button disabled={!state.enabled} onClick={() => setCompose(true)}><Plus className="h-4 w-4 mr-2" />Recognise a teammate</Button></div>
    <p className="text-xs text-muted-foreground">Saved in this browser only. Approved nominations appear on the Praise Wall.</p>
    <Tabs defaultValue="nominations"><TabsList><TabsTrigger value="nominations">Nominations</TabsTrigger>{manage && <TabsTrigger value="settings">Recognition settings</TabsTrigger>}</TabsList>
      <TabsContent value="nominations" className="space-y-4"><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mine">My recognitions</SelectItem>{manage && <SelectItem value="all">All nominations</SelectItem>}{canReview && <SelectItem value="pending">Awaiting approval</SelectItem>}</SelectContent></Select>
        {!state.approverIds.length && <p className="text-sm text-muted-foreground">No approver configured. Recognition settings must have an approver before nominations can be submitted.</p>}
        {rows.length === 0 && <p className="text-sm text-muted-foreground py-6">No matching nominations.</p>}
        {rows.map(n => <div key={n.id} className="border-b border-border py-4 space-y-2"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{name(n.toStaffId)} · {n.valueName}</p><Badge variant={n.status === 'declined' ? 'destructive' : 'outline'}>{n.status === 'pending' ? 'Awaiting approval' : n.status === 'approved' ? 'Approved' : 'Declined'}</Badge></div><p className="text-sm">{n.reason}</p><p className="text-xs text-muted-foreground">From {name(n.fromStaffId)} · {new Date(n.createdAt).toLocaleDateString('en-AU')}{n.decidedBy && ` · Reviewed by ${name(n.decidedBy)}`}{n.status === 'approved' && ` · ${n.pointsAwarded ?? 0} points`}</p>{n.decisionNote && <p className="text-sm text-muted-foreground">{n.decisionNote}</p>}{n.status === 'pending' && canReview && <Button size="sm" variant="outline" onClick={() => { setReview(n); setNote(''); }}>Review nomination</Button>}</div>)}
      </TabsContent>
      {manage && <TabsContent value="settings" className="space-y-6">
        <p className="text-xs text-muted-foreground">Local configuration only; these selections do not grant account permissions.</p>
        <div className="flex justify-between items-center"><Label htmlFor="recognition-enabled">Recognition enabled</Label><Switch id="recognition-enabled" checked={state.enabled} onCheckedChange={enabled => act(() => store.saveSettings({ enabled }))} /></div>
        <div className="space-y-2"><Label htmlFor="recognition-points">Points per approved recognition</Label><Input id="recognition-points" className="max-w-xs" type="number" min={0} step={1} value={state.approvalPoints} onChange={e => act(() => store.saveSettings({ approvalPoints: Number(e.target.value) }))} /></div>
        <div className="space-y-2"><Label>Recognition approvers</Label><div className="flex flex-wrap gap-2">{state.approverIds.map(id => <Badge key={id} variant="secondary" className="gap-1">{name(id)}<Button size="icon" variant="ghost" className="h-5 w-5" aria-label={`Remove approver ${name(id)}`} onClick={() => act(() => store.saveSettings({ approverIds: state.approverIds.filter(i => i !== id) }))}><X className="h-3 w-3" /></Button></Badge>)}</div><Select value="" onValueChange={id => act(() => store.saveSettings({ approverIds: [...state.approverIds, id] }))}><SelectTrigger><SelectValue placeholder="Add approver" /></SelectTrigger><SelectContent>{staff.filter(s => s.status === 'active' && !state.approverIds.includes(s.id)).map(s => <SelectItem key={s.id} value={s.id}>{name(s.id)}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-3"><div className="flex justify-between items-center"><h3 className="font-semibold">Company values</h3><Button size="sm" variant="outline" onClick={() => setEditing({ id: crypto.randomUUID(), name: '', description: '', active: true })}><Plus className="h-4 w-4 mr-2" />Add value</Button></div>{state.values.map(v => <div key={v.id} className="flex justify-between gap-3 border-b border-border py-3"><div><p className="font-medium">{v.name} {!v.active && <Badge variant="secondary">Inactive</Badge>}</p><p className="text-sm text-muted-foreground">{v.description}</p></div><Button size="icon" variant="ghost" aria-label={`Edit value ${v.name}`} onClick={() => setEditing(v)}><Pencil className="h-4 w-4" /></Button></div>)}</div>
      </TabsContent>}
    </Tabs>
    <PrimaryOffCanvas open={compose} onClose={() => setCompose(false)} title="Recognise a teammate" icon={Award} size="md"><div className="space-y-4"><div><Label>Teammate</Label><Select value={recipient} onValueChange={setRecipient}><SelectTrigger><SelectValue placeholder="Select teammate" /></SelectTrigger><SelectContent>{staff.filter(s => s.id !== currentUserId && s.status === 'active').map(s => <SelectItem key={s.id} value={s.id}>{name(s.id)}</SelectItem>)}</SelectContent></Select></div><div><Label>Company value</Label><Select value={valueId} onValueChange={setValueId}><SelectTrigger><SelectValue placeholder="Select company value" /></SelectTrigger><SelectContent>{state.values.filter(v => v.active).map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground mt-2">{state.values.find(v => v.id === valueId)?.description}</p></div><div><Label htmlFor="recognition-reason">Reason</Label><Textarea id="recognition-reason" value={reason} onChange={e => setReason(e.target.value)} /></div><Button disabled={!recipient || !valueId || !reason.trim()} onClick={() => act(() => { store.nominate(currentUserId, recipient, valueId, reason); setCompose(false); setReason(''); toast.success('Nomination saved for approval'); })}>Submit nomination</Button></div></PrimaryOffCanvas>
    <PrimaryOffCanvas open={!!editing} onClose={() => setEditing(null)} title="Company value" size="md">{editing && <div className="space-y-4"><Label htmlFor="value-name">Name</Label><Input id="value-name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /><Label htmlFor="value-description">Description</Label><Textarea id="value-description" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /><div className="flex justify-between"><Label htmlFor="value-active">Active</Label><Switch id="value-active" checked={editing.active} onCheckedChange={active => setEditing({ ...editing, active })} /></div><Button onClick={() => act(() => { store.saveValue(editing); setEditing(null); toast.success('Company value saved'); })}>Save value</Button></div>}</PrimaryOffCanvas>
    <PrimaryOffCanvas open={!!review} onClose={() => setReview(null)} title="Review recognition" size="md">{review && <div className="space-y-4"><h3 className="font-medium">{name(review.toStaffId)} · {review.valueName}</h3><p>{review.reason}</p><p className="text-sm text-muted-foreground">From {name(review.fromStaffId)} · {state.approvalPoints} points on approval if rewards are enabled</p><Label htmlFor="decision-note">Decision note (required to decline)</Label><Textarea id="decision-note" value={note} onChange={e => setNote(e.target.value)} /><div className="flex gap-2"><Button onClick={() => decide('approved')}><Check className="h-4 w-4 mr-2" />Approve</Button><Button variant="outline" disabled={!note.trim()} onClick={() => decide('declined')}><X className="h-4 w-4 mr-2" />Decline</Button></div></div>}</PrimaryOffCanvas>
  </div>;
}