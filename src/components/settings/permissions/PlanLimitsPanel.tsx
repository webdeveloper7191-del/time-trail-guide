import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { AlertTriangle, Check, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { planLabel } from '@/types/plans';
import {
  LimitCheck,
  LimitKey,
  LimitOverride,
  usePlanLimits,
} from '@/lib/planLimitsStore';
import { cn } from '@/lib/utils';

const fmt = (n: number | null) => (n === null ? 'Unlimited' : n.toLocaleString());

const STATUS: Record<LimitCheck['status'], { label: string; className: string }> = {
  ok: { label: 'Within limit', className: 'bg-muted text-muted-foreground' },
  near: { label: 'Near limit', className: 'bg-warning/15 text-warning-foreground' },
  breach: { label: 'Over limit', className: 'bg-destructive/10 text-destructive' },
};

/**
 * Shows the tenant's usage against the plan caps (Free is 3 staff / 1 location)
 * and lets an admin raise a documented override where a cap has to be lifted.
 */
export function PlanLimitsPanel() {
  const { tier, validation, overrides, setOverride, clearOverride } = usePlanLimits();
  const [editing, setEditing] = useState<LimitCheck | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [draft, setDraft] = useState<LimitOverride>({ value: 0, reason: '' });

  const open = (c: LimitCheck) => {
    const existing = overrides[c.key];
    setEditing(c);
    setUnlimited(existing ? existing.value === null : c.planLimit === null);
    setDraft(
      existing ?? {
        value: c.planLimit === null ? null : Math.max(c.used, c.planLimit),
        reason: '',
      },
    );
  };

  const save = () => {
    if (!editing) return;
    if (!draft.reason.trim()) {
      toast.error('Add a reason so the override is auditable');
      return;
    }
    setOverride(editing.key as LimitKey, {
      ...draft,
      value: unlimited ? null : Math.max(0, Number(draft.value ?? 0)),
    });
    toast.success(`${editing.label} limit overridden`);
    setEditing(null);
  };

  const remove = () => {
    if (!editing) return;
    clearOverride(editing.key as LimitKey);
    toast.success(`${editing.label} reverted to the plan limit`);
    setEditing(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Plan limits &amp; usage</CardTitle>
              <CardDescription>
                {planLabel(tier)} caps checked against live usage. Overrides are honoured
                everywhere the limits are enforced.
              </CardDescription>
            </div>
            {validation.ok ? (
              <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                <ShieldCheck className="h-3 w-3" /> Compliant
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 text-[10px] shrink-0">
                <AlertTriangle className="h-3 w-3" /> {validation.breaches.length} over limit
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left font-medium px-4 py-2.5">Limit</th>
                <th className="text-right font-medium px-3 py-2.5 w-[90px]">In use</th>
                <th className="text-right font-medium px-3 py-2.5 w-[110px]">Plan cap</th>
                <th className="text-right font-medium px-3 py-2.5 w-[120px]">Applied</th>
                <th className="px-3 py-2.5 font-medium text-center w-[130px]">Status</th>
                <th className="px-3 py-2.5 w-[110px]" />
              </tr>
            </thead>
            <tbody>
              {validation.checks.map(c => (
                <tr key={c.key} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{c.label}</div>
                    {c.override?.reason && (
                      <div className="text-[11px] text-muted-foreground">
                        Override: {c.override.reason}
                        {c.override.expiresOn && ` · until ${c.override.expiresOn}`}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.used.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {fmt(c.planLimit)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className="font-medium">{fmt(c.limit)}</span>
                    {c.overridden && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px]">
                        Override
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        STATUS[c.status].className,
                      )}
                    >
                      {c.status === 'ok' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {STATUS[c.status].label}
                    </span>
                    {c.excess > 0 && (
                      <div className="text-[11px] text-destructive mt-0.5">
                        {c.excess} over
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => open(c)}>
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      {c.overridden ? 'Edit' : 'Override'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <PrimaryOffCanvas
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Override ${editing.label.toLowerCase()} limit` : ''}
        description="Raise a plan cap for this workspace. Overrides are recorded with an owner and a reason, and can be time-boxed."
        icon={SlidersHorizontal}
        size="md"
        actions={[
          { label: 'Cancel', variant: 'outlined', onClick: () => setEditing(null) },
          ...(editing && overrides[editing.key as LimitKey]
            ? [{ label: 'Remove override', variant: 'outlined' as const, onClick: remove }]
            : []),
          { label: 'Save override', variant: 'primary', onClick: save },
        ]}
      >
        {editing && (
          <div className="space-y-5">
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              {planLabel(tier)} allows {fmt(editing.planLimit)} · currently using{' '}
              {editing.used.toLocaleString()}.
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Unlimited</Label>
                <p className="text-xs text-muted-foreground">Remove the cap entirely.</p>
              </div>
              <Switch checked={unlimited} onCheckedChange={setUnlimited} />
            </div>

            {!unlimited && (
              <div className="space-y-1.5">
                <Label className="text-xs">Allowed maximum</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.value ?? 0}
                  onChange={e => setDraft(d => ({ ...d, value: Number(e.target.value) || 0 }))}
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Approved by</Label>
                <Input
                  placeholder="e.g. Account manager"
                  value={draft.approvedBy ?? ''}
                  onChange={e => setDraft(d => ({ ...d, approvedBy: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expires on (optional)</Label>
                <Input
                  type="date"
                  value={draft.expiresOn ?? ''}
                  onChange={e => setDraft(d => ({ ...d, expiresOn: e.target.value || undefined }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Pilot extended to 8 staff while the paid plan is approved"
                value={draft.reason}
                onChange={e => setDraft(d => ({ ...d, reason: e.target.value }))}
              />
            </div>
          </div>
        )}
      </PrimaryOffCanvas>
    </>
  );
}
