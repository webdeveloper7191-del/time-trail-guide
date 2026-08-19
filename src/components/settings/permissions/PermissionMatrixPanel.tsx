import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
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
import { GrantDiffList } from './GrantDiffList';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RoleGrants,
  applySetModuleActions,
  applySetSubActions,
  applyToggleAction,
  applyToggleSubAction,
  countChanges,
  diffGrants,
} from '@/lib/roleGrants';
import { cn } from '@/lib/utils';

export function PermissionMatrixPanel({ query: externalQuery }: { query?: string } = {}) {
  const { roles, matrix } = usePermissionsStore();
  const { tier } = usePlan();
  const entitlements = usePlanEntitlements(); // re-render when plan entitlements change
  const [roleId, setRoleId] = useState(roles[0]?.id ?? 'owner');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAllSubs, setShowAllSubs] = useState(false);

  const [draft, setDraft] = useState<RoleGrants | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const role = roles.find(r => r.id === roleId) ?? roles[0];
  const saved = matrix[roleId] ?? {};
  const roleMatrix = draft ?? saved;

  const diff = useMemo(() => (draft ? diffGrants(saved, draft) : []), [draft, saved]);
  const pending = countChanges(diff);

  /** Switching roles abandons an unsaved draft. */
  useEffect(() => {
    setDraft(null);
  }, [roleId]);

  const edit = useCallback(
    (fn: (current: RoleGrants) => RoleGrants) =>
      setDraft(prev => fn(prev ?? (permissionsStore.getMatrix()[roleId] ?? {}))),
    [roleId],
  );

  const onToggleAction = useCallback(
    (moduleId: string, action: PermissionAction) =>
      edit(current => applyToggleAction(current, moduleId, action)),
    [edit],
  );
  const onToggleSubAction = useCallback(
    (moduleId: string, subId: string, action: PermissionAction) =>
      edit(current => applyToggleSubAction(current, moduleId, subId, action)),
    [edit],
  );
  const onSetSubAll = useCallback(
    (moduleId: string, subId: string, actions: PermissionAction[]) =>
      edit(current => applySetSubActions(current, moduleId, subId, actions)),
    [edit],
  );

  const saveDraft = () => {
    if (!draft) return;
    permissionsStore.setRoleGrants(roleId, draft);
    setDraft(null);
    setReviewOpen(false);
    toast.success(`${pending} permission change${pending === 1 ? '' : 's'} saved to ${role?.label}`);
  };

  const discardDraft = () => {
    setDraft(null);
    setReviewOpen(false);
    toast('Unsaved permission changes discarded');
  };

  const query = (externalQuery?.trim() || search.trim()).toLowerCase();

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
    edit(current => applySetModuleActions(current, moduleId, on ? allowed : []));
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
                          onToggleAction={onToggleAction}
                          onToggleSubAction={onToggleSubAction}
                          onSetSubAll={onSetSubAll}
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

      {pending > 0 && (
        <div className="sticky bottom-4 z-20">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{pending} unsaved</Badge>
              <span className="text-muted-foreground">
                Changes to <span className="font-medium text-foreground">{role?.label}</span> are
                not applied until you save.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={discardDraft}>
                Discard
              </Button>
              <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>
                Review changes
              </Button>
              <Button size="sm" onClick={saveDraft}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review changes to {role?.label}</DialogTitle>
            <DialogDescription>
              {pending} permission change{pending === 1 ? '' : 's'} across {diff.length}{' '}
              capabilit{diff.length === 1 ? 'y' : 'ies'}. Nothing is applied until you save.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto">
            <GrantDiffList rows={diff} emptyText="No pending changes." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={discardDraft}>
              Discard
            </Button>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={saveDraft}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
