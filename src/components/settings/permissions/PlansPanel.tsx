import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  PLANS,
  PLAN_ORDER,
  PlanTier,
  isAtLeast,
  planLabel,
  planModuleActions,
  requiredModuleTier,
} from '@/types/plans';
import { PERMISSION_MODULES, moduleGroups } from '@/types/permissions';
import { usePlan } from '@/lib/planStore';
import { cn } from '@/lib/utils';

const fmt = (n: number | null) => (n === null ? 'Unlimited' : n.toLocaleString());

export function PlansPanel() {
  const { tier, setTier } = usePlan();

  const rows = useMemo(
    () =>
      PERMISSION_MODULES.map(m => ({
        id: m.id,
        label: m.label,
        group: m.group,
        needs: requiredModuleTier(m.id),
        included: PLAN_ORDER.map(t => planModuleActions(t, m.id).length > 0),
      })),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {PLAN_ORDER.map(t => {
          const p = PLANS[t];
          const current = t === tier;
          return (
            <Card key={t} className={cn(current && 'border-primary ring-1 ring-primary/30')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.label}</CardTitle>
                  {current && (
                    <Badge className="text-[10px] gap-1">
                      <Sparkles className="h-3 w-3" /> Current plan
                    </Badge>
                  )}
                </div>
                <CardDescription>{p.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5">
                  {p.highlights.map(h => (
                    <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-2 text-[11px]">
                  <div>
                    <div className="text-muted-foreground">Locations</div>
                    <div className="font-medium">{fmt(p.limits.locations)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Staff</div>
                    <div className="font-medium">{fmt(p.limits.staff)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Custom roles</div>
                    <div className="font-medium">{fmt(p.limits.customRoles)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">API credentials</div>
                    <div className="font-medium">{fmt(p.limits.apiCredentials)}</div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={current ? 'outline' : 'default'}
                  disabled={current}
                  onClick={() => {
                    setTier(t);
                    toast.success(`Subscription set to ${p.label}`);
                  }}
                >
                  {current
                    ? 'Current plan'
                    : isAtLeast(tier, t)
                      ? `Downgrade to ${p.label}`
                      : `Upgrade to ${p.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What each plan unlocks</CardTitle>
          <CardDescription>
            Effective access is the role's permissions <strong>and</strong> the plan's entitlements.
            Anything locked here stays locked in the matrix, whatever the role allows.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left font-medium px-4 py-2.5 min-w-[240px]">Module</th>
                  {PLAN_ORDER.map(t => (
                    <th key={t} className="px-3 py-2.5 font-medium text-center w-[130px]">
                      {planLabel(t)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moduleGroups.map(group => {
                  const groupRows = rows.filter(r => r.group === group);
                  if (!groupRows.length) return null;
                  return (
                    <>
                      <tr key={group} className="bg-muted/30">
                        <td
                          colSpan={PLAN_ORDER.length + 1}
                          className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group}
                        </td>
                      </tr>
                      {groupRows.map(r => (
                        <tr key={r.id} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{r.label}</span>
                              {r.needs && r.needs !== 'essentials' && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {planLabel(r.needs as PlanTier)}+
                                </Badge>
                              )}
                            </div>
                          </td>
                          {r.included.map((yes, i) => (
                            <td key={PLAN_ORDER[i]} className="px-3 py-2 text-center">
                              {yes ? (
                                <Check className="h-4 w-4 mx-auto text-primary" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 mx-auto text-muted-foreground/50" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
