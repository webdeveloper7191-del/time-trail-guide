import { Fragment, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight, Lock, MoreHorizontal, Sparkles, Users } from 'lucide-react';
import {
  ALL_ACTIONS,
  PermissionAction,
  PermissionModule,
  SubPermission,
  actionLabels,
  subKey,
} from '@/types/permissions';
import { permissionsStore } from '@/lib/permissionsStore';
import { planLabel, PlanTier } from '@/types/plans';
import {
  planAllows,
  planAllowsSub,
  planModuleActions,
  requiredModuleTier,
  requiredSubTier,
  requiredTier,
} from '@/lib/planEntitlementsStore';
import { openUpgradeFlow } from '@/lib/upgradeFlow';
import { cn } from '@/lib/utils';

/** Cell shown when the plan does not include this action — promotes the upgrade. */
function LockedCell({
  needs,
  small,
  feature,
  moduleId,
}: {
  needs: PlanTier;
  small?: boolean;
  feature: string;
  moduleId: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${feature} requires the ${planLabel(needs)} plan — view upgrade`}
          onClick={() =>
            openUpgradeFlow({ needs, feature, moduleId, source: 'permission-matrix' })
          }
          className="inline-flex text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <Lock className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">
        Included from the {planLabel(needs)} plan. Click to see what upgrading unlocks.
      </TooltipContent>
    </Tooltip>
  );
}

export interface ModuleRowProps {
  module: PermissionModule;
  roleId: string;
  tier: PlanTier;
  /** Grants for this module + its sub-permissions only. */
  grants: Record<string, PermissionAction[]>;
  subs: SubPermission[];
  open: boolean;
  roleCount: number;
  /** Bumped whenever plan entitlements change so memoised rows refresh. */
  entitlementsVersion: unknown;
  onToggleOpen: (moduleId: string) => void;
  onSetAll: (moduleId: string, actions: PermissionAction[], on: boolean) => void;
  onBulkAllRoles: (
    moduleId: string,
    label: string,
    actions: PermissionAction[],
    on: boolean,
  ) => void;
  onBulkAction: (
    moduleId: string,
    label: string,
    action: PermissionAction,
    on: boolean,
  ) => void;
}

function ModuleRowInner({
  module: m,
  roleId,
  tier,
  grants,
  subs,
  open,
  roleCount,
  onToggleOpen,
  onSetAll,
  onBulkAllRoles,
  onBulkAction,
}: ModuleRowProps) {
  const granted = grants[m.id] ?? [];
  const planActions = planModuleActions(tier, m.id);
  const moduleTier = requiredModuleTier(m.id);
  const moduleLocked = planActions.length === 0;
  const allOn = planActions.length > 0 && planActions.every(a => granted.includes(a));
  const subGranted = subs.reduce((s, sub) => s + (grants[subKey(m.id, sub.id)]?.length ?? 0), 0);
  const subTotal = subs.reduce((s, sub) => s + sub.actions.length, 0);

  return (
    <Fragment>
      <tr className="border-b hover:bg-muted/20">
        <td className="px-4 py-2.5">
          <div className="flex items-start gap-1.5">
            {subs.length > 0 ? (
              <button
                type="button"
                onClick={() => onToggleOpen(m.id)}
                className="mt-0.5 text-muted-foreground hover:text-foreground"
                aria-label={open ? 'Collapse' : 'Expand'}
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{m.label}</span>
                {moduleTier && moduleTier !== 'free' && (
                  <Badge
                    variant={moduleLocked ? 'outline' : 'secondary'}
                    className="text-[10px] gap-1"
                  >
                    {moduleLocked ? (
                      <Lock className="h-2.5 w-2.5" />
                    ) : (
                      <Sparkles className="h-2.5 w-2.5" />
                    )}
                    {planLabel(moduleTier)}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{m.description}</div>
              {subs.length > 0 && (
                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {subs.length} sub-permissions · {subGranted}/{subTotal} granted
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-2 py-2.5">
          <Badge variant="outline" className="text-[10px]">
            {m.scope}
          </Badge>
        </td>
        {ALL_ACTIONS.map(a => {
          const applicable = m.actions.includes(a);
          const entitled = planAllows(tier, m.id, a);
          const needs = requiredTier(m.id, a);
          return (
            <td key={a} className="px-2 py-2.5 text-center">
              {!applicable ? (
                <span className="text-muted-foreground/40 text-xs">—</span>
              ) : entitled ? (
                <Checkbox
                  checked={granted.includes(a)}
                  onCheckedChange={() => permissionsStore.toggleAction(roleId, m.id, a)}
                  aria-label={`${actionLabels[a]} ${m.label}`}
                />
              ) : (
                <LockedCell
                  needs={needs ?? 'enterprise'}
                  moduleId={m.id}
                  feature={`${m.label} — ${actionLabels[a]}`}
                />
              )}
            </td>
          );
        })}
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={moduleLocked}
              className={cn('h-7 text-xs', allOn && 'text-muted-foreground')}
              onClick={() => onSetAll(m.id, m.actions, !allOn)}
            >
              {allOn ? 'Clear' : 'Grant all'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Bulk actions for ${m.label}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
                <DropdownMenuLabel className="text-xs">
                  Apply to all {roleCount} roles
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onBulkAllRoles(m.id, m.label, m.actions, true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Enable module + sub-permissions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAllRoles(m.id, m.label, m.actions, false)}>
                  <Users className="h-4 w-4 mr-2" />
                  Disable module + sub-permissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Single action, all roles</DropdownMenuLabel>
                {m.actions.map(a => (
                  <DropdownMenuSub key={a}>
                    <DropdownMenuSubTrigger>{actionLabels[a]}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover z-50">
                      <DropdownMenuItem onClick={() => onBulkAction(m.id, m.label, a, true)}>
                        Enable for all roles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onBulkAction(m.id, m.label, a, false)}>
                        Disable for all roles
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>

      {open &&
        subs.map(sub => {
          const key = subKey(m.id, sub.id);
          const subOn = grants[key] ?? [];
          const subPlanActions = sub.actions.filter(a => planAllowsSub(tier, m.id, sub.id, a));
          const subLocked = subPlanActions.length === 0;
          const subAllOn = !subLocked && subPlanActions.every(a => subOn.includes(a));
          const subTierNeeded = requiredSubTier(m.id, sub.id, sub.actions[0] ?? 'view');
          return (
            <tr key={key} className="border-b bg-muted/10 hover:bg-muted/20">
              <td className="px-4 py-2 pl-12">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-foreground/90">{sub.label}</span>
                  {subLocked && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Lock className="h-2.5 w-2.5" />
                      {subTierNeeded ? planLabel(subTierNeeded) : 'Locked'}
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">{sub.description}</div>
              </td>
              <td className="px-2 py-2" />
              {ALL_ACTIONS.map(a => {
                const applicable = sub.actions.includes(a);
                const parentAllows = m.actions.includes(a);
                const entitled = planAllowsSub(tier, m.id, sub.id, a);
                const needs = requiredSubTier(m.id, sub.id, a);
                return (
                  <td key={a} className="px-2 py-2 text-center">
                    {!(applicable && parentAllows) ? (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    ) : entitled ? (
                      <Checkbox
                        className="h-3.5 w-3.5"
                        checked={subOn.includes(a)}
                        onCheckedChange={() =>
                          permissionsStore.toggleSubAction(roleId, m.id, sub.id, a)
                        }
                        aria-label={`${actionLabels[a]} ${m.label} — ${sub.label}`}
                      />
                    ) : (
                      <LockedCell
                        small
                        needs={needs ?? 'enterprise'}
                        moduleId={m.id}
                        feature={`${m.label} — ${sub.label} — ${actionLabels[a]}`}
                      />
                    )}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={subLocked}
                  className="h-6 text-[11px] text-muted-foreground"
                  onClick={() =>
                    permissionsStore.setSubActions(
                      roleId,
                      m.id,
                      sub.id,
                      subAllOn ? [] : subPlanActions,
                    )
                  }
                >
                  {subAllOn ? 'Clear' : 'Grant all'}
                </Button>
              </td>
            </tr>
          );
        })}
    </Fragment>
  );
}

/**
 * Rows are memoised on their own slice of the matrix, so toggling one module
 * no longer re-renders the other ~30 modules × 8 action cells.
 */
export const ModuleRow = memo(ModuleRowInner, (prev, next) => {
  if (
    prev.module !== next.module ||
    prev.roleId !== next.roleId ||
    prev.tier !== next.tier ||
    prev.open !== next.open ||
    prev.roleCount !== next.roleCount ||
    prev.entitlementsVersion !== next.entitlementsVersion ||
    prev.subs !== next.subs
  ) {
    return false;
  }
  const keys = [prev.module.id, ...next.subs.map(s => subKey(next.module.id, s.id))];
  return keys.every(k => prev.grants[k] === next.grants[k]);
});
