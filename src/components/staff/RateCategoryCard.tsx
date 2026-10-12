import { useState } from 'react';
import { GraduationCap, Pencil } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';
import { RateCategory, RateProfile, ageOn, rateCategoryLabels, resolveCategoryRate } from '@/lib/rateCategory';
import { useRateCategories } from '@/lib/rateCategoryStore';
import { RateReviewList } from './RateReviewList';

export function RateCategoryCard({ staff }: { staff: StaffMember }) {
  const store = useRateCategories();
  const profile = store.getProfile(staff.id);
  const table = store.getTable();
  const pc = staff.currentPayCondition;
  const adultRate = pc?.hourlyRate ?? 0;
  const resolved = resolveCategoryRate(adultRate, profile, table, pc?.classification ?? pc?.position ?? 'Classification');
  const reviews = store.reviewsFor(staff);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RateProfile>(profile ?? { staffId: staff.id, category: 'adult' });
  const [overrideOn, setOverrideOn] = useState(!!profile?.adultOverride);
  const [overrideReason, setOverrideReason] = useState(profile?.adultOverride?.reason ?? '');

  const openEditor = () => {
    const p = profile ?? { staffId: staff.id, category: 'adult' as RateCategory };
    setDraft(p);
    setOverrideOn(!!p.adultOverride);
    setOverrideReason(p.adultOverride?.reason ?? '');
    setOpen(true);
  };

  const save = () => {
    if (overrideOn && !overrideReason.trim()) { toast.error('Add a reason for paying the adult rate'); return; }
    const next: RateProfile = { ...draft, adultOverride: overrideOn ? { reason: overrideReason.trim(), at: new Date().toISOString(), by: 'Admin' } : undefined };
    if (next.category === 'junior' && next.approvedJuniorAge === undefined && staff.dateOfBirth) {
      next.approvedJuniorAge = ageOn(staff.dateOfBirth, new Date());
    }
    store.saveProfile(next);
    setOpen(false);
    toast.success('Rate category saved');
  };

  const set = (patch: Partial<RateProfile>) => setDraft(d => ({ ...d, ...patch }));
  const age = staff.dateOfBirth ? ageOn(staff.dateOfBirth, new Date()) : undefined;

  return (
    <div className="card-material-elevated p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><GraduationCap className="h-4 w-4 text-primary" /></div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Rate category <Badge variant="secondary">{rateCategoryLabels[profile?.category ?? 'adult']}</Badge>
              {reviews.some(r => r.needsApproval) && <Badge variant="destructive">Approval needed</Badge>}
            </h3>
            <p className="text-sm text-muted-foreground">Junior, apprentice and trainee rates apply on top of the employment type</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={openEditor}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
      </div>
      <div className="rounded-md bg-muted/40 p-3 text-sm font-medium">{resolved.working}</div>
      {reviews.length > 0 && <RateReviewList reviews={reviews} />}

      <PrimaryOffCanvas
        title="Rate category"
        description={`${staff.firstName} ${staff.lastName}`}
        icon={GraduationCap}
        size="md"
        open={open}
        onClose={() => setOpen(false)}
        actions={[
          { label: 'Cancel', onClick: () => setOpen(false), variant: 'outlined' },
          { label: 'Save', onClick: save, variant: 'primary' },
        ]}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={draft.category} onValueChange={v => set({ category: v as RateCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(rateCategoryLabels) as RateCategory[]).map(k => <SelectItem key={k} value={k}>{rateCategoryLabels[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {draft.category === 'junior' && (
            <div className="space-y-1.5">
              <Label>Approved age step</Label>
              <Input type="number" min={14} max={20} value={draft.approvedJuniorAge ?? age ?? ''} onChange={e => set({ approvedJuniorAge: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">
                {age !== undefined ? `Currently aged ${age}. ` : 'No date of birth recorded. '}
                Birthdays and qualifications create an approval request — pay doesn't change until a manager approves.
              </p>
            </div>
          )}

          {draft.category === 'apprentice' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input type="date" value={draft.apprenticeStartDate ?? ''} onChange={e => set({ apprenticeStartDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Year of apprenticeship</Label>
                  <Select value={String(draft.approvedApprenticeYear ?? 1)} onValueChange={v => set({ approvedApprenticeYear: Number(v) as 1 | 2 | 3 | 4 })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between"><Label>Completed Year 12</Label><Switch checked={!!draft.completedYear12} onCheckedChange={c => set({ completedYear12: c })} /></div>
              <div className="flex items-center justify-between"><Label>Adult apprentice</Label><Switch checked={!!draft.adultApprentice} onCheckedChange={c => set({ adultApprentice: c })} /></div>
            </>
          )}

          {draft.category === 'trainee' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Training wage level</Label>
                <Select value={draft.traineeLevel ?? ''} onValueChange={v => set({ traineeLevel: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.keys(table.traineeByLevel).map(l => <SelectItem key={l} value={l}>{l} ({table.traineeByLevel[l]}%)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Progress</Label>
                <Input placeholder="Left school + 1 year" value={draft.traineeProgress ?? ''} onChange={e => set({ traineeProgress: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Traineeship ends</Label>
                <Input type="date" value={draft.traineeEndDate ?? ''} onChange={e => set({ traineeEndDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Training contract no.</Label>
                <Input value={draft.trainingContractNumber ?? ''} onChange={e => set({ trainingContractNumber: e.target.value })} />
              </div>
            </div>
          )}

          {draft.category === 'junior' && draft.adultRateQualification && (
            <p className="text-sm rounded-md bg-muted/40 p-2">Adult rate approved for <strong>{draft.adultRateQualification.name}</strong>.</p>
          )}

          {draft.category !== 'adult' && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between"><Label>Pay adult rate (override)</Label><Switch checked={overrideOn} onCheckedChange={setOverrideOn} /></div>
              {overrideOn && <Textarea placeholder="Reason (recorded in the audit trail)" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />}
            </div>
          )}
        </div>
      </PrimaryOffCanvas>
    </div>
  );
}
