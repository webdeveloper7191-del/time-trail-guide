import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Plus, Trash2, Save } from 'lucide-react';
import { PLANS, PLAN_ORDER, PlanTier } from '@/types/plans';
import { formatMoney } from '@/lib/billingStore';
import { PriceRevision, pricingSchedule, usePricingSchedule } from '@/lib/pricingScheduleStore';

const dateLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function RevisionEditor({
  revision,
  onSave,
  onCancel,
}: {
  revision: PriceRevision;
  onSave: (r: PriceRevision) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<PriceRevision>(revision);
  const set = (patch: Partial<PriceRevision>) => setDraft(d => ({ ...d, ...patch }));

  return (
    <div className="rounded-md border p-3 space-y-3 bg-muted/20">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Effective from</Label>
          <Input
            type="date"
            value={draft.effectiveFrom}
            onChange={e => set({ effectiveFrom: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Label</Label>
          <Input value={draft.label} onChange={e => set({ label: e.target.value })} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left font-medium px-3 py-2">Plan</th>
              <th className="text-left font-medium px-3 py-2 w-[160px]">Monthly / user</th>
              <th className="text-left font-medium px-3 py-2 w-[180px]">Annual discount / user</th>
              <th className="text-left font-medium px-3 py-2 w-[150px]">Effective annual</th>
            </tr>
          </thead>
          <tbody>
            {PLAN_ORDER.map((t: PlanTier) => (
              <tr key={t} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{PLANS[t].label}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={draft.monthly[t]}
                    onChange={e =>
                      set({ monthly: { ...draft.monthly, [t]: Number(e.target.value) || 0 } })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={draft.annualDiscount[t]}
                    onChange={e =>
                      set({
                        annualDiscount: {
                          ...draft.annualDiscount,
                          [t]: Number(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatMoney(Math.max(0, draft.monthly[t] - draft.annualDiscount[t]))} / user / mo
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => onSave(draft)}>
          <Save className="h-3.5 w-3.5" /> Save revision
        </Button>
      </div>
    </div>
  );
}

/** Admin-only price book: schedule a price change from a future date. */
export function PricingSchedulePanel() {
  const { revisions, active, upcoming } = usePricingSchedule();
  const [editing, setEditing] = useState<PriceRevision | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Price book &amp; scheduled changes
            </CardTitle>
            <CardDescription>
              Prices are versioned by effective date. The newest revision on or before today is what
              tenants are quoted and charged; future revisions switch over automatically on their
              date, with no manual step.
            </CardDescription>
          </div>
          {!editing && (
            <Button size="sm" className="gap-1.5" onClick={() => setEditing(pricingSchedule.draft())}>
              <Plus className="h-3.5 w-3.5" /> Schedule price change
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing && (
          <RevisionEditor
            revision={editing}
            onCancel={() => setEditing(null)}
            onSave={r => {
              pricingSchedule.save(r);
              setEditing(null);
            }}
          />
        )}

        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left font-medium px-3 py-2">Effective from</th>
                <th className="text-left font-medium px-3 py-2">Revision</th>
                {PLAN_ORDER.map(t => (
                  <th key={t} className="text-left font-medium px-3 py-2">
                    {PLANS[t].label}
                  </th>
                ))}
                <th className="px-3 py-2 w-[140px]" />
              </tr>
            </thead>
            <tbody>
              {revisions.map(r => {
                const isActive = r.id === active.id;
                const isFuture = upcoming.some(u => u.id === r.id);
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">{dateLabel(r.effectiveFrom)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span>{r.label}</span>
                        {isActive && <Badge className="text-[10px]">Live</Badge>}
                        {isFuture && (
                          <Badge variant="secondary" className="text-[10px]">
                            Scheduled
                          </Badge>
                        )}
                      </div>
                    </td>
                    {PLAN_ORDER.map(t => (
                      <td key={t} className="px-3 py-2 text-muted-foreground">
                        {formatMoney(r.monthly[t])}
                        <span className="text-[11px]">
                          {' '}
                          / {formatMoney(Math.max(0, r.monthly[t] - r.annualDiscount[t]))} annual
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      {r.id !== 'base' && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => pricingSchedule.remove(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {upcoming.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Next change: <strong>{upcoming[0].label}</strong> takes effect{' '}
            {dateLabel(upcoming[0].effectiveFrom)}. Existing subscriptions keep their current rate
            until their next renewal or plan change after that date.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
