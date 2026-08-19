import { Fragment, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Gem,
  MoreHorizontal,
  RotateCcw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ALL_ACTIONS,
  PERMISSION_MODULES,
  actionDescriptions,
  actionLabels,
  getSubPermissions,
  moduleGroups,
  subKey,
  PermissionAction,
} from '@/types/permissions';
import { PLANS, PLAN_ORDER, PlanTier, planLabel } from '@/types/plans';
import {
  CapabilityImpact,
  capabilityImpact,
  planCoverage,
  planEntitlementsStore,
  usePlanEntitlements,
} from '@/lib/planEntitlementsStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlan } from '@/lib/planStore';
import { cn } from '@/lib/utils';

interface PendingToggle {
  label: string;
  actionLabel: string;
  impact: CapabilityImpact;
  apply: () => void;
}

export function PlanEntitlementMatrixPanel({ query: externalQuery }: { query?: string } = {}) {
  const entitlements = usePlanEntitlements();
  const { tier: currentTier } = usePlan();
  const [tier, setTier] = useState<PlanTier>(currentTier);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAllSubs, setShowAllSubs] = useState(false);
  const [pending, setPending] = useState<PendingToggle | null>(null);

  const ent = entitlements[tier] ?? {};
  const query = (externalQuery?.trim() || search).trim().toLowerCase();

  const modules = useMemo(
    () =>
      PERMISSION_MODULES.filter(
        m =>
          !query ||
          m.label.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          getSubPermissions(m.id).some(
            s => s.label.toLowerCase().includes(query) || s.description.toLowerCase().includes(query),
          ),
      ),
    [query],
  );

  const moduleMatches = (label: string, description: string) =>
    !query || label.toLowerCase().includes(query) || description.toLowerCase().includes(query);

  const visibleSubs = (moduleId: string, label: string, description: string) => {
    const subs = getSubPermissions(moduleId);
    if (!query || moduleMatches(label, description)) return subs;
    return subs.filter(
      s => s.label.toLowerCase().includes(query) || s.description.toLowerCase().includes(query),
    );
  };

  const isOpen = (moduleId: string) => (query ? true : (expanded[moduleId] ?? showAllSubs));

  const coverage = planCoverage(tier);

  /**
   * Turning a capability off cascades to every higher tier, so warn with the
   * number of tenants that would lose it before applying the change.
   */
  const guardedToggle = (
    key: string,
    action: PermissionAction,
    isOn: boolean,
    label: string,
    apply: () => void,
  ) => {
    if (!isOn) {
      apply();
      return;
    }
    const impact = capabilityImpact(tier, key, action);
    if (impact.tenants === 0 && impact.roles === 0) {
      apply();
      return;
    }
    setPending({ label, actionLabel: actionLabels[action], impact, apply });
  };

  const exportCsv = () => {
    const header = [
      'Plan',
      'Module',
      'Sub-permission',
      'Group',
      ...ALL_ACTIONS.map(a => actionLabels[a]),
    ];
    const rows: string[][] = [];
    PLAN_ORDER.forEach(t => {
      const e = entitlements[t] ?? {};
      PERMISSION_MODULES.forEach(m => {
        rows.push([
          planLabel(t),
          m.label,
          '(module)',
          m.group,
          ...ALL_ACTIONS.map(a =>
            !m.actions.includes(a) ? 'n/a' : (e[m.id] ?? []).includes(a) ? 'Included' : 'Locked',
          ),
        ]);
        getSubPermissions(m.id).forEach(sub => {
          const granted = e[subKey(m.id, sub.id)] ?? [];
          rows.push([
            planLabel(t),
            m.label,
            sub.label,
            m.group,
            ...ALL_ACTIONS.map(a =>
              !sub.actions.includes(a) ? 'n/a' : granted.includes(a) ? 'Included' : 'Locked',
            ),
          ]);
        });
      });
    });
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan-entitlements.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Plan entitlements exported');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-base">Plan entitlement matrix</CardTitle>
            <CardDescription>
              Tick exactly what each subscription plan sells, down to individual
              sub-permissions. Plans stay cumulative — anything included in a lower plan is
              automatically included in the ones above it.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border p-0.5">
              {PLAN_ORDER.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-[5px] transition-colors',
                    tier === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {PLANS[t].label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={externalQuery?.trim() ? externalQuery : 'Search modules or sub-permissions…'}
                className="pl-8 w-[250px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAllSubs(v => !v);
                setExpanded({});
              }}
            >
              {showAllSubs ? (
                <ChevronRight className="h-4 w-4 mr-1.5" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1.5" />
              )}
              {showAllSubs ? 'Collapse all' : 'Expand all'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                planEntitlementsStore.resetToDefaults();
                toast.success('Plan entitlements reset to defaults');
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="secondary" className="gap-1">
            <Gem className="h-3.5 w-3.5" /> {PLANS[tier].label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {PLANS[tier].tagline} · {coverage.granted} of {coverage.total} capabilities included
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50">
              <tr className="border-b">
                <th className="text-left font-medium px-4 py-2.5 min-w-[280px]">Module</th>
                {ALL_ACTIONS.map(a => (
                  <th key={a} className="px-2 py-2.5 font-medium text-center w-[78px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{actionLabels[a]}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px]">
                        {actionDescriptions[a]}
                      </TooltipContent>
                    </Tooltip>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right font-medium w-[120px]">All / none</th>
              </tr>
            </thead>
            <tbody>
              {moduleGroups.map(group => {
                const groupModules = modules.filter(m => m.group === group);
                if (!groupModules.length) return null;
                return (
                  <Fragment key={group}>
                    <tr className="bg-muted/30">
                      <td
                        colSpan={ALL_ACTIONS.length + 2}
                        className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {group}
                      </td>
                    </tr>
                    {groupModules.map(m => {
                      const included = ent[m.id] ?? [];
                      const allOn = m.actions.every(a => included.includes(a));
                      const subs = visibleSubs(m.id, m.label, m.description);
                      const open = isOpen(m.id);
                      return (
                        <Fragment key={m.id}>
                          <tr className="border-b hover:bg-muted/20">
                            <td className="px-4 py-2.5">
                              <div className="flex items-start gap-1.5">
                                {subs.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpanded(p => ({ ...p, [m.id]: !isOpen(m.id) }))
                                    }
                                    className="mt-0.5 text-muted-foreground hover:text-foreground"
                                    aria-label={open ? 'Collapse' : 'Expand'}
                                  >
                                    {open ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-4" />
                                )}
                                <div>
                                  <div className="font-medium">{m.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {m.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {ALL_ACTIONS.map(a => {
                              const applicable = m.actions.includes(a);
                              return (
                                <td key={a} className="px-2 py-2.5 text-center">
                                  {applicable ? (
                                    <Checkbox
                                      checked={included.includes(a)}
                                      onCheckedChange={() =>
                                        guardedToggle(m.id, a, included.includes(a), m.label, () =>
                                          planEntitlementsStore.toggleModuleAction(tier, m.id, a),
                                        )
                                      }
                                      aria-label={`${actionLabels[a]} ${m.label} on ${PLANS[tier].label}`}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground/40 text-xs">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn('h-7 text-xs', allOn && 'text-muted-foreground')}
                                  onClick={() =>
                                    planEntitlementsStore.setModule(tier, m.id, !allOn)
                                  }
                                >
                                  {allOn ? 'Clear' : 'Include all'}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      aria-label={`Bulk plan actions for ${m.label}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-60 bg-popover z-50">
                                    <DropdownMenuLabel className="text-xs">
                                      Apply to every plan
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        PLAN_ORDER.forEach(t =>
                                          planEntitlementsStore.setModule(t, m.id, true),
                                        );
                                        toast.success(`${m.label} included in all plans`);
                                      }}
                                    >
                                      Include in all plans
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        PLAN_ORDER.forEach(t =>
                                          planEntitlementsStore.setModule(t, m.id, false),
                                        );
                                        toast.success(`${m.label} removed from all plans`);
                                      }}
                                    >
                                      Remove from all plans
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs">
                                      Enterprise only
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        PLAN_ORDER.forEach(t =>
                                          planEntitlementsStore.setModule(
                                            t,
                                            m.id,
                                            t === 'enterprise',
                                          ),
                                        );
                                        toast.success(`${m.label} is now Enterprise only`);
                                      }}
                                    >
                                      Make {m.label} Enterprise only
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                          {open &&
                            subs.map(sub => {
                              const key = subKey(m.id, sub.id);
                              const subOn = ent[key] ?? [];
                              const subAllOn = sub.actions.every(a => subOn.includes(a));
                              return (
                                <tr key={key} className="border-b bg-muted/10 hover:bg-muted/20">
                                  <td className="px-4 py-2 pl-12">
                                    <div className="text-[13px] font-medium text-foreground/90">
                                      {sub.label}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {sub.description}
                                    </div>
                                  </td>
                                  {ALL_ACTIONS.map(a => {
                                    const applicable = sub.actions.includes(a);
                                    const parentApplicable = m.actions.includes(a);
                                    return (
                                      <td key={a} className="px-2 py-2 text-center">
                                        {applicable && parentApplicable ? (
                                          <Checkbox
                                            className="h-3.5 w-3.5"
                                            checked={subOn.includes(a)}
                                            onCheckedChange={() =>
                                              guardedToggle(
                                                key,
                                                a,
                                                subOn.includes(a),
                                                `${m.label} — ${sub.label}`,
                                                () =>
                                                  planEntitlementsStore.toggleSubAction(
                                                    tier,
                                                    m.id,
                                                    sub.id,
                                                    a,
                                                  ),
                                              )
                                            }
                                            aria-label={`${actionLabels[a]} ${m.label} — ${sub.label} on ${PLANS[tier].label}`}
                                          />
                                        ) : (
                                          <span className="text-muted-foreground/30 text-xs">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-2 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[11px] text-muted-foreground"
                                      onClick={() =>
                                        planEntitlementsStore.setSub(tier, m.id, sub.id, !subAllOn)
                                      }
                                    >
                                      {subAllOn ? 'Clear' : 'Include all'}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={!!pending} onOpenChange={o => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove “{pending?.actionLabel} {pending?.label}” from {PLANS[tier].label}?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Plans are cumulative, so this also removes the capability from{' '}
                  {pending?.impact.tiers.map(t => PLANS[t].label).join(', ')}.
                </p>
                <div className="rounded-md border p-3 space-y-1 text-foreground">
                  <div className="flex justify-between">
                    <span>Tenants impacted</span>
                    <span className="font-semibold">{pending?.impact.tenants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billed seats affected</span>
                    <span className="font-semibold">{pending?.impact.seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Roles currently granting it</span>
                    <span className="font-semibold">{pending?.impact.roles}</span>
                  </div>
                </div>
                {!!pending?.impact.names.length && (
                  <p className="text-xs text-muted-foreground">
                    e.g. {pending.impact.names.join(', ')}
                    {pending.impact.tenants > pending.impact.names.length ? ' and others' : ''}
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                pending?.apply();
                toast.success('Entitlement updated');
                setPending(null);
              }}
            >
              Remove capability
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
