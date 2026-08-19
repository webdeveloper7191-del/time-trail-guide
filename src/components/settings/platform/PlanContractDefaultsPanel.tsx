import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PLAN_ORDER, PlanTier } from '@/types/plans';
import {
  UpliftBasis,
  effectiveUplift,
  upliftBasisLabels,
} from '@/lib/tenantAgreementStore';
import {
  planContractDefaultsStore,
  usePlanContractDefaults,
} from '@/lib/planContractDefaultsStore';

const TERM_OPTIONS = [1, 3, 6, 12, 24, 36, 60];

/**
 * Plan-level contract defaults: the term length and annual CPI/KPI price
 * change rules every new agreement and renewal inherits for that plan.
 */
export function PlanContractDefaultsPanel() {
  const defaults = usePlanContractDefaults();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Contract defaults per plan</CardTitle>
          <CardDescription>
            Term length and annual price-change rules applied to every new agreement and renewal
            issued on each plan. Individual agreements can still be varied at issue time.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            planContractDefaultsStore.reset();
            toast.success('Contract defaults reset');
          }}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLAN_ORDER.map(tier => {
          const d = defaults[tier];
          const set = (patch: Parameters<typeof planContractDefaultsStore.update>[1]) =>
            planContractDefaultsStore.update(tier, patch);
          return (
            <div key={tier} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold tracking-tight">{PLANS[tier].label}</h4>
                  <Badge variant="outline" className="text-[10px]">
                    {d.termMonths}-month term
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {upliftBasisLabels[d.priceTerms.basis]}
                    {d.priceTerms.basis !== 'none'
                      ? ` · ${effectiveUplift(d.priceTerms).toFixed(1)}%`
                      : ''}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {d.priceTerms.autoRenew ? 'Auto-renews' : 'Manual renewal'} ·{' '}
                  {d.priceTerms.noticeDays}d notice
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="space-y-1.5">
                  <Label className="text-xs">Term length</Label>
                  <Select
                    value={String(d.termMonths)}
                    onValueChange={v => set({ termMonths: Number(v) })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERM_OPTIONS.map(m => (
                        <SelectItem key={m} value={String(m)}>
                          {m} month{m > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Increase basis</Label>
                  <Select
                    value={d.priceTerms.basis}
                    onValueChange={v => set({ priceTerms: { ...d.priceTerms, basis: v as UpliftBasis } })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(upliftBasisLabels) as UpliftBasis[]).map(b => (
                        <SelectItem key={b} value={b}>
                          {upliftBasisLabels[b]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {d.priceTerms.basis === 'cpi' ? 'Assumed CPI %' : 'Increase %'}
                  </Label>
                  <Input
                    className="h-9"
                    type="number"
                    min={0}
                    step={0.1}
                    disabled={d.priceTerms.basis === 'none'}
                    value={d.priceTerms.percent}
                    onChange={e =>
                      set({ priceTerms: { ...d.priceTerms, percent: Number(e.target.value) || 0 } })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CPI cap %</Label>
                  <Input
                    className="h-9"
                    type="number"
                    min={0}
                    step={0.1}
                    disabled={d.priceTerms.basis !== 'cpi'}
                    value={d.priceTerms.capPercent ?? 0}
                    onChange={e =>
                      set({ priceTerms: { ...d.priceTerms, capPercent: Number(e.target.value) || 0 } })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Auto-renew</Label>
                  <Select
                    value={d.priceTerms.autoRenew ? 'yes' : 'no'}
                    onValueChange={v => set({ priceTerms: { ...d.priceTerms, autoRenew: v === 'yes' } })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notice days</Label>
                  <Input
                    className="h-9"
                    type="number"
                    min={0}
                    value={d.priceTerms.noticeDays}
                    onChange={e =>
                      set({ priceTerms: { ...d.priceTerms, noticeDays: Number(e.target.value) || 0 } })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Default terms & special conditions</Label>
                <Textarea
                  rows={2}
                  value={d.termsNotes ?? ''}
                  placeholder="Payment terms, minimum commitment, negotiated inclusions…"
                  onChange={e => set({ termsNotes: e.target.value })}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default PlanContractDefaultsPanel;
