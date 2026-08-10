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
import {
  planAllows,
  planAllowsSub,
  planLabel,
  planModuleActions,
  requiredModuleTier,
  requiredSubTier,
  requiredTier,
} from '@/types/plans';
import { cn } from '@/lib/utils';

export function PermissionMatrixPanel() {
  const { roles, matrix } = usePermissionsStore();
  const { tier } = usePlan();
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

    permissionsStore.setModuleActions(roleId, moduleId, on ? actions : []);
  };

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
                      {groupModules.map(m => {
                        const granted = roleMatrix[m.id] ?? [];
                        const allOn = m.actions.every(a => granted.includes(a));
                        const subs = visibleSubs(m.id, m.label, m.description);
                        const open = isOpen(m.id);
                        const subGranted = subs.reduce(
                          (s, sub) => s + (roleMatrix[subKey(m.id, sub.id)]?.length ?? 0),
                          0,
                        );
                        const subTotal = subs.reduce((s, sub) => s + sub.actions.length, 0);
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
                                    {subs.length > 0 && (
                                      <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                                        {subs.length} sub-permissions · {subGranted}/{subTotal}{' '}
                                        granted
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
                                return (
                                  <td key={a} className="px-2 py-2.5 text-center">
                                    {applicable ? (
                                      <Checkbox
                                        checked={granted.includes(a)}
                                        onCheckedChange={() =>
                                          permissionsStore.toggleAction(roleId, m.id, a)
                                        }
                                        aria-label={`${actionLabels[a]} ${m.label}`}
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
                                    onClick={() => setAll(m.id, m.actions, !allOn)}
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
                                        Apply to all {roles.length} roles
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => bulkAllRoles(m.id, m.label, m.actions, true)}
                                      >
                                        <Users className="h-4 w-4 mr-2" />
                                        Enable module + sub-permissions
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => bulkAllRoles(m.id, m.label, m.actions, false)}
                                      >
                                        <Users className="h-4 w-4 mr-2" />
                                        Disable module + sub-permissions
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel className="text-xs">
                                        Single action, all roles
                                      </DropdownMenuLabel>
                                      {m.actions.map(a => (
                                        <DropdownMenuSub key={a}>
                                          <DropdownMenuSubTrigger>
                                            {actionLabels[a]}
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent className="bg-popover z-50">
                                            <DropdownMenuItem
                                              onClick={() => bulkAction(m.id, m.label, a, true)}
                                            >
                                              Enable for all roles
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => bulkAction(m.id, m.label, a, false)}
                                            >
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
                                const subOn = roleMatrix[key] ?? [];
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
                                    <td className="px-2 py-2" />
                                    {ALL_ACTIONS.map(a => {
                                      const applicable = sub.actions.includes(a);
                                      const parentAllows = m.actions.includes(a);
                                      return (
                                        <td key={a} className="px-2 py-2 text-center">
                                          {applicable && parentAllows ? (
                                            <Checkbox
                                              className="h-3.5 w-3.5"
                                              checked={subOn.includes(a)}
                                              onCheckedChange={() =>
                                                permissionsStore.toggleSubAction(
                                                  roleId,
                                                  m.id,
                                                  sub.id,
                                                  a,
                                                )
                                              }
                                              aria-label={`${actionLabels[a]} ${m.label} — ${sub.label}`}
                                            />
                                          ) : (
                                            <span className="text-muted-foreground/30 text-xs">
                                              —
                                            </span>
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
                                          permissionsStore.setSubActions(
                                            roleId,
                                            m.id,
                                            sub.id,
                                            subAllOn ? [] : sub.actions,
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
                      })}
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
