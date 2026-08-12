import { Fragment, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  ChevronDown,
  ChevronRight,
  Download,
  Lock,
  MoreHorizontal,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';


import { toast } from 'sonner';
import {
  ALL_ACTIONS,
  PERMISSION_MODULES,
  PermissionAction,
  actionDescriptions,
  actionLabels,
  getSubPermissions,
  moduleGroups,
  subKey,
} from '@/types/permissions';
import { permissionsStore, usePermissionsStore } from '@/lib/permissionsStore';
import { usePlan } from '@/lib/planStore';
import { planLabel, PlanTier } from '@/types/plans';
import {
  planAllows,
  planAllowsSub,
  planModuleActions,
  requiredModuleTier,
  requiredSubTier,
  requiredTier,
  usePlanEntitlements,
} from '@/lib/planEntitlementsStore';
import { upgradePrompt } from '@/lib/upgradePrompt';
import { ModuleRow } from './ModuleRow';
import { cn } from '@/lib/utils';

export function PermissionMatrixPanel() {
  const { roles, matrix } = usePermissionsStore();
  const { tier } = usePlan();
  const entitlements = usePlanEntitlements(); // re-render when plan entitlements change
  const [roleId, setRoleId] = useState(roles[0]?.id ?? 'owner');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAllSubs, setShowAllSubs] = useState(false);

  const role = roles.find(r => r.id === roleId) ?? roles[0];
  const roleMatrix = matrix[roleId] ?? {};


  const query = search.trim().toLowerCase();

  const matchesModule = (id: string, label: string, description: string) =>
    !query || label.toLowerCase().includes(query) || description.toLowerCase().includes(query);

  const modules = useMemo(() => {
    const q = query;
    return PERMISSION_MODULES.filter(
      m =>
        !q ||
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        getSubPermissions(m.id).some(
          s =>
            s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
        ),
    );
  }, [query]);

  /** Sub-permissions visible for a module given the current search. */
  const visibleSubs = (moduleId: string, moduleLabel: string, moduleDescription: string) => {
    const subs = getSubPermissions(moduleId);
    if (!query || matchesModule(moduleId, moduleLabel, moduleDescription)) return subs;
    return subs.filter(
      s =>
        s.label.toLowerCase().includes(query) || s.description.toLowerCase().includes(query),
    );
  };

  /** Stable per-module sub-permission lists so memoised rows keep identity. */
  const subsByModule = useMemo(() => {
    const map: Record<string, ReturnType<typeof getSubPermissions>> = {};
    for (const m of PERMISSION_MODULES) map[m.id] = visibleSubs(m.id, m.label, m.description);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  const subsFor = (m: (typeof PERMISSION_MODULES)[number]) => subsByModule[m.id] ?? [];

  // While searching, matching sub-permissions are revealed automatically.
  const isOpen = (moduleId: string) =>
    query ? true : (expanded[moduleId] ?? showAllSubs);


  const grantedCount = PERMISSION_MODULES.reduce(
    (sum, m) =>
      sum +
      (roleMatrix[m.id]?.length ?? 0) +
      getSubPermissions(m.id).reduce(
        (s, sub) => s + (roleMatrix[subKey(m.id, sub.id)]?.length ?? 0),
        0,
      ),
    0,
  );
  const totalCount = PERMISSION_MODULES.reduce(
    (sum, m) =>
      sum + m.actions.length + getSubPermissions(m.id).reduce((s, sub) => s + sub.actions.length, 0),
    0,
  );

  const bulkAllRoles = (
    moduleId: string,
    label: string,
    actions: PermissionAction[],
    on: boolean,
  ) => {
    permissionsStore.setModuleForAllRoles(moduleId, on, actions);
    toast.success(
      `${label} ${on ? 'enabled' : 'disabled'} (with sub-permissions) for all ${roles.length} roles`,
    );
  };

  const bulkAction = (
    moduleId: string,
    label: string,
    action: PermissionAction,
    on: boolean,
  ) => {
    permissionsStore.setActionForAllRoles(moduleId, action, on);
    toast.success(
      `${actionLabels[action]} ${on ? 'granted on' : 'removed from'} ${label} for all ${roles.length} roles`,
    );
  };

  const setAll = (moduleId: string, actions: PermissionAction[], on: boolean) => {
    // Never grant something the current subscription plan does not include.
    const allowed = actions.filter(a => planAllows(tier, moduleId, a));
    permissionsStore.setModuleActions(roleId, moduleId, on ? allowed : []);
  };

  /** Cell shown when the plan does not include this action — promotes the upgrade. */
  const LockedCell = ({
    needs,
    small,
    feature,
    moduleId,
  }: {
    needs: PlanTier;
    small?: boolean;
    feature: string;
    moduleId: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${feature} requires the ${planLabel(needs)} plan — view upgrade`}
          onClick={() =>
            upgradePrompt.open({ needs, feature, moduleId, source: 'permission-matrix' })
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



  const exportCsv = () => {
    const header = ['Module', 'Sub-permission', 'Group', 'Scope', ...ALL_ACTIONS.map(a => actionLabels[a])];
    const rows: string[][] = [];
    PERMISSION_MODULES.forEach(m => {
      rows.push([
        m.label,
        '(module)',
        m.group,
        m.scope,
        ...ALL_ACTIONS.map(a =>
          !m.actions.includes(a) ? 'n/a' : (roleMatrix[m.id] ?? []).includes(a) ? 'Yes' : 'No',
        ),
      ]);
      getSubPermissions(m.id).forEach(sub => {
        const granted = roleMatrix[subKey(m.id, sub.id)] ?? [];
        rows.push([
          m.label,
          sub.label,
          m.group,
          m.scope,
          ...ALL_ACTIONS.map(a =>
            !sub.actions.includes(a) ? 'n/a' : granted.includes(a) ? 'Yes' : 'No',
          ),
        ]);
      });
    });
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `permission-matrix-${roleId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Permission matrix exported');
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-base">Permission matrix</CardTitle>
              <CardDescription>
                Tick the actions this role can perform in each module. Granting any action
                automatically grants View; removing View removes all access to the module.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search modules or sub-permissions…"
                  className="pl-8 w-[260px]"

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
                  permissionsStore.resetToDefaults();
                  toast.success('Roles and matrix reset to defaults');
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> {role?.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {role?.description} · {grantedCount} of {totalCount} permissions granted
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="border-b">
                  <th className="text-left font-medium px-4 py-2.5 min-w-[280px]">Module</th>
                  <th className="text-left font-medium px-2 py-2.5 w-[90px]">Scope</th>
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
                  <th className="px-3 py-2.5 text-right font-medium w-[110px]">All / none</th>
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
                          colSpan={ALL_ACTIONS.length + 3}
                          className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group}
                        </td>
                      </tr>
                      {groupModules.map(m => (
                        <ModuleRow
                          key={m.id}
                          module={m}
                          roleId={roleId}
                          tier={tier}
                          grants={roleMatrix}
                          subs={subsFor(m)}
                          open={isOpen(m.id)}
                          roleCount={roles.length}
                          entitlementsVersion={entitlements}
                          onToggleOpen={id => setExpanded(prev => ({ ...prev, [id]: !isOpen(id) }))}
                          onSetAll={setAll}
                          onBulkAllRoles={bulkAllRoles}
                          onBulkAction={bulkAction}
                        />
                      ))}
                    </Fragment>
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
