import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Plus, Trash2, Lock, Search, Copy, Eye, MoreVertical, GitCompare, FileJson, Download, Save } from 'lucide-react';

import { toast } from 'sonner';
import {
  PERMISSION_MODULES,
  RoleDefinition,
  actionLabels,
  getSubPermissions,
  subKey,
} from '@/types/permissions';
import { permissionsStore, usePermissionsStore } from '@/lib/permissionsStore';
import { usePlan } from '@/lib/planStore';
import { RoleDetailSheet } from './RoleDetailSheet';
import { RoleCompareDialog } from './RoleCompareDialog';
import { RoleTemplatesSheet, exportRoleAsTemplate } from './RoleTemplatesSheet';
import { roleTemplateStore } from '@/lib/roleTemplateStore';

interface RolesPanelProps {
  /** Search text driven by the page header; merged with the local box. */
  query?: string;
  /**
   * `tenant` (default) — org admins manage their custom roles.
   * `system` — platform admins define the default roles shipped to every tenant.
   */
  scope?: 'tenant' | 'system';
}

export function RolesPanel({ scope = 'tenant', query: externalQuery }: RolesPanelProps = {}) {
  const isSystemScope = scope === 'system';
  const { roles: allRoles, matrix, assignments } = usePermissionsStore();
  const roles = useMemo(
    () => (isSystemScope ? allRoles.filter(r => r.system) : allRoles),
    [allRoles, isSystemScope],
  );
  const { plan } = usePlan();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [copyFrom, setCopyFrom] = useState('none');
  const [query, setQuery] = useState('');
  const [detailRole, setDetailRole] = useState<RoleDefinition | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareFrom, setCompareFrom] = useState<string | undefined>();
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const customCount = roles.filter(r => !r.system).length;
  const roleCap = plan.limits.customRoles;
  const atCap = !isSystemScope && roleCap !== null && customCount >= roleCap;

  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const list of Object.values(assignments)) {
      for (const roleId of new Set(list.map(a => a.roleId))) {
        counts[roleId] = (counts[roleId] ?? 0) + 1;
      }
    }
    return counts;
  }, [assignments]);

  const effectiveQuery = externalQuery?.trim() || query;

  const filtered = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r => {
      if (r.label.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) return true;
      // Also search what the role can actually do, e.g. "approve payroll".
      const grants = matrix[r.id] ?? {};
      return PERMISSION_MODULES.some(m => {
        const moduleMatch = (text: string) =>
          `${m.label} ${text}`.toLowerCase().includes(q) ||
          q.split(/\s+/).every(t => `${m.label} ${text}`.toLowerCase().includes(t));
        const moduleActions = grants[m.id] ?? [];
        if (
          moduleActions.length &&
          moduleActions.some(a => moduleMatch(actionLabels[a]))
        )
          return true;
        return getSubPermissions(m.id).some(sub => {
          const acts = grants[subKey(m.id, sub.id)] ?? [];
          return (
            acts.length &&
            acts.some(a => moduleMatch(`${sub.label} ${actionLabels[a]}`))
          );
        });
      });
    });
  }, [roles, effectiveQuery, matrix]);


  const openCreate = (fromRoleId?: string) => {
    if (atCap) {
      toast.error(
        roleCap === 0
          ? `Custom roles are not included in the ${plan.label} plan`
          : `The ${plan.label} plan allows ${roleCap} custom roles`,
      );
      return;
    }
    const source = fromRoleId ? roles.find(r => r.id === fromRoleId) : undefined;
    setLabel(source ? `${source.label} (copy)` : '');
    setDescription(source?.description ?? '');
    setCopyFrom(fromRoleId ?? 'none');
    setOpen(true);
  };

  const create = () => {
    const name = label.trim();
    if (!name) return;
    if (atCap) {
      toast.error(
        roleCap === 0
          ? `Custom roles are not included in the ${plan.label} plan`
          : `The ${plan.label} plan allows ${roleCap} custom roles`,
      );
      return;
    }
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (roles.some(r => r.id === id)) {
      toast.error('A role with that name already exists');
      return;
    }
    const newRole: RoleDefinition = {
      id,
      label: name,
      description: description.trim(),
      system: isSystemScope,
    };
    permissionsStore.addRole(newRole, copyFrom === 'none' ? undefined : copyFrom);
    toast.success(`Role "${name}" created — you can now edit its permissions`);
    setOpen(false);
    setLabel('');
    setDescription('');
    setCopyFrom('none');
    // Drop straight into the editable detail panel for the new custom role.
    setDetailRole(newRole);
  };

  const renderRow = (r: RoleDefinition) => {
    const assigned = userCounts[r.id] ?? 0;
    return (
      <tr key={r.id} className="border-b border-border last:border-0 even:bg-muted/30 hover:bg-muted/50 transition-colors">
        <td className="px-4 py-3 border-r border-border align-middle">
          <button
            className="font-medium text-left hover:text-primary transition-colors"
            onClick={() => setDetailRole(r)}
          >
            {r.label}
          </button>
        </td>
        <td className="px-4 py-3 border-r border-border align-middle text-muted-foreground max-w-md truncate">
          {r.description || '—'}
        </td>
        <td className="px-4 py-3 border-r border-border align-middle">
          {r.system ? (
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Default Role
            </span>
          ) : (
            <span>Custom Role</span>
          )}
        </td>
        <td className="px-4 py-3 border-r border-border align-middle">
          {assigned ? (
            <Badge variant="secondary" className="rounded-full px-2.5">{assigned}</Badge>
          ) : (
            <span className="text-muted-foreground">–</span>
          )}
        </td>
        <td className="px-4 py-3 text-right align-middle">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailRole(r)}>
                <Eye className="h-4 w-4 mr-2" />{' '}
                {r.system && !isSystemScope ? 'View permissions' : 'Edit permissions'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreate(r.id)}>
                <Copy className="h-4 w-4 mr-2" /> Clone role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCompareFrom(r.id);
                  setCompareOpen(true);
                }}
              >
                <GitCompare className="h-4 w-4 mr-2" /> Compare with…
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  roleTemplateStore.saveFromRole(r, `${r.label} template`);
                  toast.success(`"${r.label}" saved as a role template`);
                }}
              >
                <Save className="h-4 w-4 mr-2" /> Save as template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportRoleAsTemplate(r)}>
                <Download className="h-4 w-4 mr-2" /> Export JSON
              </DropdownMenuItem>
              {(!r.system || isSystemScope) && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    permissionsStore.deleteRole(r.id);
                    toast.success('Role deleted');
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete role
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 rounded-lg"
            placeholder="Search Role"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-lg"
            onClick={() => {
              setCompareFrom(undefined);
              setCompareOpen(true);
            }}
            disabled={roles.length < 2}
          >
            <GitCompare className="h-4 w-4 mr-1.5" /> Compare roles
          </Button>
          <Button variant="outline" className="h-10 rounded-lg" onClick={() => setTemplatesOpen(true)}>
            <FileJson className="h-4 w-4 mr-1.5" /> Templates
          </Button>
        <Button className="h-10 rounded-lg" onClick={() => openCreate()} disabled={atCap}>
          <Plus className="h-4 w-4 mr-1.5" />
          {isSystemScope ? 'New Default Role' : 'New Custom Role'}
        </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-4 py-3 font-medium border-r border-border">Name</th>
              <th className="px-4 py-3 font-medium border-r border-border">Description</th>
              <th className="px-4 py-3 font-medium border-r border-border">Type of Role</th>
              <th className="px-4 py-3 font-medium border-r border-border">Assigned To</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map(renderRow)
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No roles match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {isSystemScope
          ? 'These default roles ship with every tenant. Adding or editing them changes the baseline permissions new tenants start from.'
          : `Default roles are read-only — clone one to create a tailored role. Custom roles on ${plan.label}: ${customCount} of ${roleCap === null ? 'unlimited' : roleCap}.`}
      </p>


      <RoleDetailSheet
        role={detailRole}
        allowSystemEdit={isSystemScope}
        matrix={matrix}
        open={!!detailRole}
        onOpenChange={v => !v && setDetailRole(null)}
      />

      <RoleCompareDialog
        roles={allRoles}
        matrix={matrix}
        open={compareOpen}
        onOpenChange={setCompareOpen}
        initialLeft={compareFrom}
      />

      <RoleTemplatesSheet roles={allRoles} open={templatesOpen} onOpenChange={setTemplatesOpen} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>{isSystemScope ? 'New default role' : 'New role'}</SheetTitle>
            <SheetDescription>
              {isSystemScope
                ? 'Create a default role available to every tenant, optionally starting from an existing role\'s permissions.'
                : "Create a custom role, optionally starting from an existing role's permissions."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Role name</Label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Area Coordinator"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What this role is responsible for"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start from</Label>
              <Select value={copyFrom} onValueChange={setCopyFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No permissions</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      Copy from {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={create} disabled={!label.trim()}>
              Create role
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

