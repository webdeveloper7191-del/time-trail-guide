import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Plus, Trash2, Lock, Search, Copy, Eye, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PERMISSION_MODULES, RoleDefinition } from '@/types/permissions';
import { permissionsStore, usePermissionsStore } from '@/lib/permissionsStore';
import { usePlan } from '@/lib/planStore';
import { RoleDetailSheet } from './RoleDetailSheet';

export function RolesPanel() {
  const { roles, matrix, assignments } = usePermissionsStore();
  const { plan } = usePlan();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [copyFrom, setCopyFrom] = useState('none');
  const [query, setQuery] = useState('');
  const [detailRole, setDetailRole] = useState<RoleDefinition | null>(null);

  const customCount = roles.filter(r => !r.system).length;
  const roleCap = plan.limits.customRoles;
  const atCap = roleCap !== null && customCount >= roleCap;

  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const roleId of Object.values(assignments)) counts[roleId] = (counts[roleId] ?? 0) + 1;
    return counts;
  }, [assignments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      r => r.label.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
    );
  }, [roles, query]);

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
    permissionsStore.addRole(
      { id, label: name, description: description.trim(), system: false },
      copyFrom === 'none' ? undefined : copyFrom,
    );
    toast.success(`Role "${name}" created`);
    setOpen(false);
    setLabel('');
    setDescription('');
    setCopyFrom('none');
  };

  const renderRole = (r: RoleDefinition) => {
    const modulesWithAccess = PERMISSION_MODULES.filter(
      m => (matrix[r.id]?.[m.id]?.length ?? 0) > 0,
    ).length;
    const actionCount = PERMISSION_MODULES.reduce(
      (s, m) => s + (matrix[r.id]?.[m.id]?.length ?? 0),
      0,
    );
    return (
      <div key={r.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{r.label}</span>
            {r.system ? (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" /> System
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Custom</Badge>
            )}
            <Badge variant="outline" className="text-[10px] gap-1">
              <Users className="h-3 w-3" /> {userCounts[r.id] ?? 0}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">{r.description}</p>
          <p className="text-xs text-muted-foreground">
            {modulesWithAccess} of {PERMISSION_MODULES.length} modules · {actionCount} permissions
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setDetailRole(r)}>
            <Eye className="h-4 w-4 mr-1.5" /> View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openCreate(r.id)} title="Clone role">
            <Copy className="h-4 w-4" />
          </Button>
          {!r.system && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                permissionsStore.deleteRole(r.id);
                toast.success('Role deleted');
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const systemRoles = filtered.filter(r => r.system);
  const customRoles = filtered.filter(r => !r.system);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
        <div>
          <CardTitle className="text-base">Roles</CardTitle>
          <CardDescription>
            System roles ship with a sensible baseline and are read-only. Clone one to create a
            tailored role. Custom roles on {plan.label}: {customCount} of{' '}
            {roleCap === null ? 'unlimited' : roleCap}.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-9 w-56"
              placeholder="Search roles"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={() => openCreate()} disabled={atCap}>
            <Plus className="h-4 w-4 mr-1.5" /> New role
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            System admin roles ({systemRoles.length})
          </h3>
          {systemRoles.length ? systemRoles.map(renderRole) : (
            <p className="text-xs text-muted-foreground">No system roles match your search.</p>
          )}
        </section>
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Custom roles ({customRoles.length})
          </h3>
          {customRoles.length ? customRoles.map(renderRole) : (
            <p className="text-xs text-muted-foreground">
              No custom roles yet — clone a system role to get started.
            </p>
          )}
        </section>
      </CardContent>

      <RoleDetailSheet
        role={detailRole}
        matrix={matrix}
        open={!!detailRole}
        onOpenChange={v => !v && setDetailRole(null)}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>New role</SheetTitle>
            <SheetDescription>
              Create a custom role, optionally starting from an existing role's permissions.
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
    </Card>
  );
}

