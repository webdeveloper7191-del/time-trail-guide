import { useMemo, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Lock, Search, ShieldCheck, ChevronRight, Check, Pencil, X, Minus } from 'lucide-react';
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
  const [grantedOnly, setGrantedOnly] = useState(true);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLabel(role?.label ?? '');
    setDescription(role?.description ?? '');
    setQuery('');
    setEditing(false);
    // Custom roles open in "show everything" mode so rights can be granted.
    setGrantedOnly(role?.system ?? true);
    setExpanded({});
  }, [role?.id, open]);

  const grants = role ? matrix[role.id] ?? {} : {};

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byGroup = new Map<string, Array<{ module: typeof PERMISSION_MODULES[number]; subs: ReturnType<typeof getSubPermissions> }>>();

    for (const m of PERMISSION_MODULES) {
      const moduleGranted = grants[m.id] ?? [];
      const allSubs = getSubPermissions(m.id);
      const matchModule = !q || m.label.toLowerCase().includes(q);

      let subs = matchModule ? allSubs : allSubs.filter(s => s.label.toLowerCase().includes(q));
      if (grantedOnly) subs = subs.filter(s => (grants[subKey(m.id, s.id)] ?? []).length > 0);

      const hasAnything = moduleGranted.length > 0 || subs.length > 0;
      if (grantedOnly && !hasAnything) continue;
      if (q && !matchModule && subs.length === 0) continue;

      const list = byGroup.get(m.group) ?? [];
      list.push({ module: m, subs });
      byGroup.set(m.group, list);
    }
    return [...byGroup.entries()];
  }, [query, grantedOnly, grants]);

  if (!role) return null;

  const totalActions = PERMISSION_MODULES.reduce((s, m) => s + (grants[m.id]?.length ?? 0), 0);
  const modulesWithAccess = PERMISSION_MODULES.filter(m => (grants[m.id]?.length ?? 0) > 0).length;
  const noAccessCount = PERMISSION_MODULES.length - modulesWithAccess;

  const save = () => {
    const name = label.trim();
    if (!name) return;
    permissionsStore.updateRole(role.id, { label: name, description: description.trim() });
    toast.success('Role updated');
    setEditing(false);
  };

  const canEditRights = !role.system;

  // Fixed-column action grid: every row uses the same column order so states
  // line up vertically and can be scanned at a glance. For custom roles each
  // applicable cell is a toggle.
  const actionGrid = (
    actions: PermissionAction[],
    granted: PermissionAction[],
    onToggle?: (a: PermissionAction) => void,
  ) => (
    <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
      {ALL_ACTIONS.map(a => {
        const applicable = actions.includes(a);
        const on = applicable && granted.includes(a);
        const interactive = applicable && !!onToggle;
        const className =
          'flex items-center justify-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-medium ' +
          (!applicable
            ? 'bg-muted/40 text-muted-foreground/40'
            : on
              ? 'bg-primary/10 text-primary'
              : 'border border-dashed border-border text-muted-foreground/70') +
          (interactive ? ' hover:ring-1 hover:ring-primary/40 cursor-pointer transition-shadow' : '');
        const title = !applicable
          ? `${actionLabels[a]} — not applicable`
          : `${actionLabels[a]} — ${on ? 'granted' : 'denied'}${onToggle ? ' (click to toggle)' : ''}`;
        const inner = (
          <>
            {applicable ? (
              on ? <Check className="h-2.5 w-2.5 shrink-0" /> : <X className="h-2.5 w-2.5 shrink-0" />
            ) : (
              <Minus className="h-2.5 w-2.5 shrink-0" />
            )}
            <span className="truncate">{actionLabels[a]}</span>
          </>
        );
        return interactive ? (
          <button key={a} type="button" title={title} className={className} onClick={() => onToggle!(a)}>
            {inner}
          </button>
        ) : (
          <span key={a} title={title} className={className}>
            {inner}
          </span>
        );
      })}
    </div>
  );

  const coverageBar = (granted: number, total: number) => (
    <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
      <div
        className={granted === 0 ? 'h-full bg-muted-foreground/30' : 'h-full bg-primary'}
        style={{ width: `${total ? (granted / total) * 100 : 0}%` }}
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] flex flex-col p-0">
        <div className="px-6 pt-6 pb-4 border-b">
          <SheetHeader className="space-y-2">
            <SheetTitle className="flex items-center gap-2 text-lg">
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
            <SheetDescription className="text-xs">
              {role.description}
              {role.system && ' System roles are read-only — clone one to tailor access.'}
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Modules with access', value: `${modulesWithAccess}/${PERMISSION_MODULES.length}` },
              { label: 'Permissions granted', value: totalActions },
              { label: 'Modules blocked', value: noAccessCount },
            ].map(s => (
              <div key={s.label} className="rounded-lg border bg-muted/30 px-3 py-2">
                <div className="text-base font-semibold leading-tight">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {!role.system && (
            <div className="mt-3">
              {editing ? (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role name</Label>
                    <Input value={label} onChange={e => setLabel(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={save} disabled={!label.trim()}>Save changes</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit role details
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-9"
              placeholder="Search modules or sub-permissions"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
            <Switch checked={grantedOnly} onCheckedChange={setGrantedOnly} />
            Granted only
          </label>
        </div>

        <div className="px-6 py-2 border-b flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded bg-primary/10 text-primary">
              <Check className="h-2.5 w-2.5" />
            </span>
            Granted
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded border border-dashed">
              <X className="h-2.5 w-2.5" />
            </span>
            Denied
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded bg-muted/40 text-muted-foreground/40">
              <Minus className="h-2.5 w-2.5" />
            </span>
            Not applicable
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {grantedOnly
                  ? 'This role has no granted permissions matching your search. Turn off “Granted only” to see everything.'
                  : 'Nothing matches your search.'}
              </p>
            )}
            {groups.map(([group, items]) => (
              <section key={group} className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </h3>
                <div className="rounded-lg border divide-y">
                  {items.map(({ module, subs }) => {
                    const granted = grants[module.id] ?? [];
                    const isOpen = expanded[module.id] ?? false;
                    const grantedSubs = subs.filter(s => (grants[subKey(module.id, s.id)] ?? []).length > 0).length;
                    return (
                      <Collapsible
                        key={module.id}
                        open={isOpen}
                        onOpenChange={v => setExpanded(p => ({ ...p, [module.id]: v }))}
                      >
                        <div className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{module.label}</div>
                              <div className="text-[11px] text-muted-foreground">{module.scope} scope</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {coverageBar(granted.length, module.actions.length)}
                              {granted.length === 0 ? (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  No access
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  {granted.length} of {module.actions.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {actionGrid(
                            module.actions,
                            granted,
                            canEditRights
                              ? a => permissionsStore.toggleAction(role.id, module.id, a)
                              : undefined,
                          )}
                          {subs.length > 0 && (
                            <>
                              <CollapsibleTrigger asChild>
                                <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                                  <ChevronRight
                                    className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                  />
                                  {isOpen ? 'Hide' : 'Show'} {subs.length} sub-permission{subs.length > 1 ? 's' : ''}
                                  {!grantedOnly && ` · ${grantedSubs} granted`}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="pl-3 border-l space-y-2.5 mt-2">
                                  {subs.map(sub => (
                                    <div key={sub.id} className="space-y-1">
                                      <div className="text-xs font-medium">{sub.label}</div>
                                      {actionGrid(
                                        sub.actions,
                                        grants[subKey(module.id, sub.id)] ?? [],
                                        canEditRights
                                          ? a => permissionsStore.toggleSubAction(role.id, module.id, sub.id, a)
                                          : undefined,
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </>
                          )}
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
