import { useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileJson, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { RoleDefinition } from '@/types/permissions';
import { permissionsStore } from '@/lib/permissionsStore';
import { grantTotal } from '@/lib/roleGrants';
import {
  ApplyMode,
  RoleTemplate,
  applyTemplateToRole,
  downloadTemplate,
  parseTemplate,
  roleTemplateStore,
  useRoleTemplates,
} from '@/lib/roleTemplateStore';

/**
 * Save, download, import and re-apply role grant sets so the same role can be
 * rolled out across tenants without rebuilding the matrix by hand.
 */
export function RoleTemplatesSheet({
  roles,
  open,
  onOpenChange,
}: {
  roles: RoleDefinition[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const templates = useRoleTemplates();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sourceRoleId, setSourceRoleId] = useState(roles[0]?.id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [targetRoleId, setTargetRoleId] = useState(roles.find(r => !r.system)?.id ?? roles[0]?.id ?? '');
  const [mode, setMode] = useState<ApplyMode>('replace');
  const [pasted, setPasted] = useState('');

  const saveSnapshot = () => {
    const role = roles.find(r => r.id === sourceRoleId);
    if (!role) return;
    const template = roleTemplateStore.saveFromRole(
      role,
      name.trim() || `${role.label} template`,
      description.trim() || undefined,
    );
    setName('');
    setDescription('');
    toast.success(`Saved "${template.name}" (${grantTotal(template.grants)} permissions)`);
  };

  const apply = (template: RoleTemplate) => {
    const target = roles.find(r => r.id === targetRoleId);
    if (!target) return;
    if (target.system) {
      toast.error('Default roles are read-only — apply the template to a custom role');
      return;
    }
    applyTemplateToRole(target.id, template.grants, mode);
    toast.success(
      `${mode === 'replace' ? 'Replaced' : 'Merged into'} ${target.label} · ${grantTotal(
        template.grants,
      )} permissions from "${template.name}"`,
    );
  };

  const ingest = (text: string) => {
    const parsed = parseTemplate(text);
    if (!parsed.ok || !parsed.template) {
      toast.error(parsed.error ?? 'Could not read that template');
      return;
    }
    roleTemplateStore.add(parsed.template);
    setPasted('');
    toast.success(
      `Imported "${parsed.template.name}" · ${parsed.grantCount} permissions${
        parsed.skipped ? ` · ${parsed.skipped} unknown entr${parsed.skipped === 1 ? 'y' : 'ies'} skipped` : ''
      }`,
    );
  };

  const onFile = async (file?: File | null) => {
    if (!file) return;
    ingest(await file.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Role templates</SheetTitle>
          <SheetDescription>
            Snapshot a role's permissions, move it between tenants as a JSON file, and re-apply it
            to any custom role.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-3 rounded-lg border p-3">
            <h3 className="text-sm font-medium">Save a role as a template</h3>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={sourceRoleId} onValueChange={setSourceRoleId}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label>Template name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Centre Manager — standard"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What this template is for"
                rows={2}
              />
            </div>
            <Button size="sm" onClick={saveSnapshot} disabled={!sourceRoleId}>
              Save snapshot
            </Button>
          </section>

          <section className="space-y-3 rounded-lg border p-3">
            <h3 className="text-sm font-medium">Import</h3>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={e => onFile(e.target.files?.[0])}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1.5" /> Upload JSON
              </Button>
              <span className="text-xs text-muted-foreground">
                Unknown modules are skipped automatically.
              </span>
            </div>
            <Textarea
              value={pasted}
              onChange={e => setPasted(e.target.value)}
              placeholder="…or paste template JSON here"
              rows={3}
              className="font-mono text-xs"
            />
            <Button size="sm" variant="outline" disabled={!pasted.trim()} onClick={() => ingest(pasted)}>
              <FileJson className="h-4 w-4 mr-1.5" /> Import pasted JSON
            </Button>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5 flex-1 min-w-[180px]">
                <Label>Apply to role</Label>
                <Select value={targetRoleId} onValueChange={setTargetRoleId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.id} disabled={r.system}>
                        {r.label}
                        {r.system ? ' (read-only)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 w-[150px]">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={v => setMode(v as ApplyMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">Replace grants</SelectItem>
                    <SelectItem value="merge">Add to grants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
                No templates yet. Save a snapshot or import a JSON file.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {templates.map(t => (
                  <div key={t.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t.sourceRole ? `From ${t.sourceRole} · ` : ''}
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {grantTotal(t.grants)} perms
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" onClick={() => apply(t)}>
                        Apply
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadTemplate(t)}>
                        <Download className="h-4 w-4 mr-1.5" /> Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          roleTemplateStore.remove(t.id);
                          toast.success('Template deleted');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Download one role's grants without saving a stored template first. */
export function exportRoleAsTemplate(role: RoleDefinition) {
  const grants = permissionsStore.getMatrix()[role.id] ?? {};
  downloadTemplate({
    name: role.label,
    description: role.description,
    sourceRole: role.label,
    createdAt: new Date().toISOString(),
    grants,
  });
  toast.success(`${role.label} exported as a role template`);
}
