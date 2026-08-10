import { Fragment, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, Download, RotateCcw, Search, ShieldCheck } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export function PermissionMatrixPanel() {
  const { roles, matrix } = usePermissionsStore();
  const [roleId, setRoleId] = useState(roles[0]?.id ?? 'owner');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAllSubs, setShowAllSubs] = useState(false);

  const role = roles.find(r => r.id === roleId) ?? roles[0];
  const roleMatrix = matrix[roleId] ?? {};

  const modules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PERMISSION_MODULES.filter(
      m =>
        !q ||
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        getSubPermissions(m.id).some(s => s.label.toLowerCase().includes(q)),
    );
  }, [search]);

  const isOpen = (moduleId: string) => showAllSubs || !!expanded[moduleId];

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
                  placeholder="Find module…"
                  className="pl-8 w-[200px]"
                />
              </div>
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
                    <>
                      <tr key={group} className="bg-muted/30">
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
                        return (
                          <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2.5">
                              <div className="font-medium">{m.label}</div>
                              <div className="text-xs text-muted-foreground">{m.description}</div>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn('h-7 text-xs', allOn && 'text-muted-foreground')}
                                onClick={() => setAll(m.id, m.actions, !allOn)}
                              >
                                {allOn ? 'Clear' : 'Grant all'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
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
