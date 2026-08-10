import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Plus, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { PERMISSION_MODULES } from '@/types/permissions';
import { permissionsStore, usePermissionsStore } from '@/lib/permissionsStore';
import { usePlan } from '@/lib/planStore';

export function RolesPanel() {
  const { roles, matrix } = usePermissionsStore();
  const { plan } = usePlan();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [copyFrom, setCopyFrom] = useState('none');

  const customCount = roles.filter(r => !r.system).length;
  const roleCap = plan.limits.customRoles;
  const atCap = roleCap !== null && customCount >= roleCap;

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


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Roles</CardTitle>
          <CardDescription>
            System roles ship with a sensible baseline. Clone one to create a tailored role.
            {' '}Custom roles on {plan.label}: {customCount} of{' '}
            {roleCap === null ? 'unlimited' : roleCap}.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} disabled={atCap}>
          <Plus className="h-4 w-4 mr-1.5" /> New role
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {roles.map(r => {
          const modulesWithAccess = PERMISSION_MODULES.filter(
            m => (matrix[r.id]?.[m.id]?.length ?? 0) > 0,
          ).length;
          const actionCount = PERMISSION_MODULES.reduce(
            (s, m) => s + (matrix[r.id]?.[m.id]?.length ?? 0),
            0,
          );
          return (
            <div
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.label}</span>
                  {r.system ? (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Lock className="h-3 w-3" /> System
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Custom
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl">{r.description}</p>
                <p className="text-xs text-muted-foreground">
                  {modulesWithAccess} of {PERMISSION_MODULES.length} modules · {actionCount}{' '}
                  permissions
                </p>
              </div>
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
          );
        })}
      </CardContent>

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
