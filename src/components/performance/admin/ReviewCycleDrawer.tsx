import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  performanceConfigStore,
  ReviewCycleConfig,
  ReviewCycleStage,
  reviewCycleStageLabels,
  totalWeight,
} from '@/lib/performanceConfigStore';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  cycle?: ReviewCycleConfig | null;
}

const REMINDER_OPTIONS = [14, 7, 3, 1];

export function ReviewCycleDrawer({ open, onClose, cycle }: Props) {
  const config = performanceConfigStore.get();
  const blank = (): Omit<ReviewCycleConfig, 'id'> => ({
    name: '',
    cycle: 'annual',
    periodStart: '',
    periodEnd: '',
    selfReviewDue: '',
    managerReviewDue: '',
    calibrationDate: '',
    ratingScaleId: config.ratingScales.find(s => s.isDefault)?.id ?? config.ratingScales[0]?.id ?? '',
    competencyIds: config.competencies.filter(c => c.isActive).map(c => c.id),
    locationIds: [],
    stage: 'not_started',
    autoRemindersDays: [7, 3, 1],
  });

  const [draft, setDraft] = useState<Omit<ReviewCycleConfig, 'id'> & { id?: string }>(blank());

  useEffect(() => {
    if (open) setDraft(cycle ? { ...cycle } : blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cycle]);

  const weight = useMemo(() => totalWeight(config.competencies, draft.competencyIds), [config.competencies, draft.competencyIds]);

  const toggleCompetency = (id: string) => {
    setDraft(d => ({
      ...d,
      competencyIds: d.competencyIds.includes(id) ? d.competencyIds.filter(x => x !== id) : [...d.competencyIds, id],
    }));
  };

  const toggleReminder = (day: number) => {
    setDraft(d => ({
      ...d,
      autoRemindersDays: d.autoRemindersDays.includes(day)
        ? d.autoRemindersDays.filter(x => x !== day)
        : [...d.autoRemindersDays, day].sort((a, b) => b - a),
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) return toast.error('Give the cycle a name');
    if (!draft.periodStart || !draft.periodEnd) return toast.error('Set the review period');
    if (draft.periodEnd < draft.periodStart) return toast.error('Period end must be after the start');
    if (!draft.selfReviewDue || !draft.managerReviewDue) return toast.error('Set both due dates');
    if (draft.managerReviewDue < draft.selfReviewDue) return toast.error('Manager review is due before the self review');
    if (!draft.ratingScaleId) return toast.error('Pick a rating scale');
    if (draft.competencyIds.length === 0) return toast.error('Select at least one competency');
    performanceConfigStore.saveReviewCycle(draft);
    toast.success(draft.id ? 'Review cycle updated' : 'Review cycle created');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title={draft.id ? 'Edit review cycle' : 'New review cycle'}
      description="Set the period, deadlines, scale and competencies for a review round."
      icon={CalendarDays}
      size="lg"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save cycle', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Cycle name</Label>
          <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. FY27 annual review" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={draft.cycle} onValueChange={(v: ReviewCycleConfig['cycle']) => setDraft(d => ({ ...d, cycle: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="semi_annual">Semi-annual</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={draft.stage} onValueChange={(v: ReviewCycleStage) => setDraft(d => ({ ...d, stage: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(reviewCycleStageLabels) as ReviewCycleStage[]).map(s => (
                  <SelectItem key={s} value={s}>{reviewCycleStageLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Period start</Label>
            <Input type="date" value={draft.periodStart} onChange={e => setDraft(d => ({ ...d, periodStart: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Period end</Label>
            <Input type="date" value={draft.periodEnd} onChange={e => setDraft(d => ({ ...d, periodEnd: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Self review due</Label>
            <Input type="date" value={draft.selfReviewDue} onChange={e => setDraft(d => ({ ...d, selfReviewDue: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Manager review due</Label>
            <Input type="date" value={draft.managerReviewDue} onChange={e => setDraft(d => ({ ...d, managerReviewDue: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Calibration date (optional)</Label>
            <Input type="date" value={draft.calibrationDate ?? ''} onChange={e => setDraft(d => ({ ...d, calibrationDate: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Rating scale</Label>
            <Select value={draft.ratingScaleId} onValueChange={v => setDraft(d => ({ ...d, ratingScaleId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select scale" /></SelectTrigger>
              <SelectContent>
                {config.ratingScales.filter(s => s.isActive || s.id === draft.ratingScaleId).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Competencies in this cycle</Label>
            <Badge variant={weight === 100 ? 'secondary' : 'destructive'}>Total weight {weight}%</Badge>
          </div>
          {weight !== 100 && (
            <p className="text-xs text-muted-foreground">Weights should add up to 100% so overall ratings are comparable.</p>
          )}
          <div className="space-y-2">
            {config.competencies.map(c => (
              <label key={c.id} className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox checked={draft.competencyIds.includes(c.id)} onCheckedChange={() => toggleCompetency(c.id)} disabled={!c.isActive && !draft.competencyIds.includes(c.id)} />
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground"> · {c.category} · {c.weight}%</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-md border p-3 space-y-2">
          <Label className="text-sm">Automatic reminders before each due date</Label>
          <div className="flex gap-4 pt-1">
            {REMINDER_OPTIONS.map(day => (
              <label key={day} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={draft.autoRemindersDays.includes(day)} onCheckedChange={() => toggleReminder(day)} />
                {day} day{day > 1 ? 's' : ''}
              </label>
            ))}
          </div>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
