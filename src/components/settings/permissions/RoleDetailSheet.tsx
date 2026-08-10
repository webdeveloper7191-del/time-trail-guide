import { useMemo, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  ALL_ACTIONS,
  PERMISSION_MODULES,
  PermissionAction,
  PermissionMatrix,
  RoleDefinition,
  actionLabels,
  getSubPermissions,
  subKey,
} from '@/types/permissions';
import { permissionsStore } from '@/lib/permissionsStore';

interface Props {
  role: RoleDefinition | null;
  matrix: PermissionMatrix;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function RoleDetailSheet({ role, matrix, open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setLabel(role?.label ?? '');
    setDescription(role?.description ?? '');
    setQuery('');
  }, [role?.id, open]);

  const grants = role ? matrix[role.id] ?? {} : {};

  const modules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PERMISSION_MODULES.map(m => {
      const subs = getSubPermissions(m.id);
      const matchModule = !q || m.label.toLowerCase().includes(q);
      const visibleSubs = q && !matchModule ? subs.filter(s => s.label.toLowerCase().includes(q)) : subs;
      return { module: m, subs: visibleSubs, visible: matchModule || visibleSubs.length > 0 };
    }).filter(x => x.visible);
  }, [query]);

  if (!role) return null;

  const totalActions = PERMISSION_MODULES.reduce((s, m) => s + (grants[m.id]?.length ?? 0), 0);
  const modulesWithAccess = PERMISSION_MODULES.filter(m => (grants[m.id]?.length ?? 0) > 0).length;

  const save = () => {
    const name = label.trim();
    if (!name) return;
    permissionsStore.updateRole(role.id, { label: name, description: description.trim() });
    toast.success('Role updated');
    onOpenChange(false);
  };

  const renderActions = (actions: PermissionAction[], granted: PermissionAction[]) => (
    <div className="flex flex-wrap gap-1">
      {ALL_ACTIONS.filter(a => actions.includes(a)).map(a => (
        <Badge
          key={a}
          variant={granted.includes(a) ? 'default' : 'outline'}
          className={granted.includes(a) ? 'text-[10px]' : 'text-[10px] text-muted-foreground opacity-60'}
        >
          {actionLabels[a]}
        </Badge>
      ))}
      {actions.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {role.label}
            {role.system ? (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" /> System
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Custom</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {modulesWithAccess} of {PERMISSION_MODULES.length} modules · {totalActions} module-level permissions.
            {role.system && ' System roles are read-only — clone one to tailor access.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 flex-1 min-h-0 flex flex-col">
          {!role.system && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-1.5">
                <Label>Role name</Label>
                <Input value={label} onChange={e => setLabel(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              </div>
              <Button size="sm" onClick={save} disabled={!label.trim()}>Save changes</Button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Filter modules or sub-permissions"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {modules.map(({ module, subs }) => {
                const granted = grants[module.id] ?? [];
                return (
                  <div key={module.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{module.label}</div>
                        <div className="text-xs text-muted-foreground">{module.group} · {module.scope} scope</div>
                      </div>
                      {granted.length === 0 && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">No access</Badge>
                      )}
                    </div>
                    {renderActions(module.actions, granted)}
                    {subs.length > 0 && (
                      <div className="pl-3 border-l space-y-2 mt-2">
                        {subs.map(sub => (
                          <div key={sub.id} className="space-y-1">
                            <div className="text-xs font-medium">{sub.label}</div>
                            {renderActions(sub.actions, grants[subKey(module.id, sub.id)] ?? [])}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
