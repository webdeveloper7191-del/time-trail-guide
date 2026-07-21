/**
 * Config-driven panel that renders MasterListShell + an edit sheet for any
 * SimpleMasterStore. Each master supplies its columns and a set of typed
 * `fields` that are rendered in the edit sheet.
 */
import { ReactNode, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, ArchiveRestore, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { MasterListShell } from './MasterListShell';
import { AuditLogDrawer } from './AuditLogDrawer';
import type { MasterColumn, MasterItem } from '@/lib/masterData/types';
import type { SimpleMasterStore } from '@/lib/masterData/factory';

export type FieldDef<T> =
  | { key: keyof T & string; type: 'text' | 'textarea' | 'number'; label: string; help?: string; placeholder?: string; uppercase?: boolean; width?: 'full' | 'half' }
  | { key: keyof T & string; type: 'toggle'; label: string; help?: string; width?: 'full' | 'half' }
  | { key: keyof T & string; type: 'select'; label: string; help?: string; options: { value: string; label: string }[]; width?: 'full' | 'half' }
  | { key: keyof T & string; type: 'multiselect'; label: string; help?: string; options: { value: string; label: string }[]; width?: 'full' | 'half' };

interface Props<T extends MasterItem> {
  title: string;
  description: string;
  store: SimpleMasterStore<T>;
  columns: MasterColumn<T>[];
  fields: FieldDef<T>[];
  newItem: () => T;
  extraEditor?: (draft: T, setDraft: (d: T) => void) => ReactNode;
}

export function GenericMasterPanel<T extends MasterItem>({
  title, description, store, columns, fields, newItem, extraEditor,
}: Props<T>) {
  const items = store.use();
  const [editing, setEditing] = useState<T | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  return (
    <>
      <MasterListShell<T>
        title={title}
        description={description}
        items={items}
        columns={columns}
        onAdd={() => setEditing(newItem())}
        onRowClick={setEditing}
        onShowAudit={() => setAuditOpen(true)}
        renderActions={i => i.status === 'active' ? (
          <Button variant="ghost" size="sm" onClick={() => { store.archive(i.id); toast.success('Archived'); }}>
            <Archive className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => { store.restore(i.id); toast.success('Restored'); }}>
            <ArchiveRestore className="h-4 w-4" />
          </Button>
        )}
      />
      <GenericEditor
        item={editing}
        title={title}
        fields={fields}
        extraEditor={extraEditor}
        onClose={() => setEditing(null)}
        onSave={(next) => { store.upsert(next); setEditing(null); toast.success('Saved'); }}
      />
      <AuditLogDrawer open={auditOpen} onOpenChange={setAuditOpen} masterKey={store.MASTER_KEY} title={title} />
    </>
  );
}

function GenericEditor<T extends MasterItem>({
  item, title, fields, extraEditor, onClose, onSave,
}: {
  item: T | null;
  title: string;
  fields: FieldDef<T>[];
  extraEditor?: (draft: T, setDraft: (d: T) => void) => ReactNode;
  onClose: () => void;
  onSave: (v: T) => void;
}) {
  const [draft, setDraft] = useState<T | null>(item);
  if (item && draft?.id !== item.id) setDraft(item);
  if (!draft) return null;

  const setField = (k: string, v: unknown) => setDraft({ ...draft, [k]: v } as T);

  return (
    <Sheet open={!!item} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{draft.label || `New ${title.toLowerCase().replace(/s$/, '')}`}</SheetTitle>
          <SheetDescription>Configure how this option behaves across roster, timesheet and payroll.</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div>
            <Label>Label</Label>
            <Input value={draft.label} onChange={e => setField('label', e.target.value)} />
          </div>
          <div>
            <Label>Code</Label>
            <Input value={draft.code} onChange={e => setField('code', e.target.value.toUpperCase())} />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea rows={2} value={draft.description ?? ''} onChange={e => setField('description', e.target.value)} />
          </div>

          {fields.map(f => {
            const val = (draft as unknown as Record<string, unknown>)[f.key];
            const wrap = f.width === 'full' ? 'col-span-2' : '';
            if (f.type === 'text' || f.type === 'number') {
              return (
                <div key={f.key} className={wrap}>
                  <Label>{f.label}</Label>
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={(val as string | number | undefined) ?? ''}
                    placeholder={f.placeholder}
                    onChange={e => setField(f.key, f.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : (f.uppercase ? e.target.value.toUpperCase() : e.target.value))}
                  />
                  {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
                </div>
              );
            }
            if (f.type === 'textarea') {
              return (
                <div key={f.key} className="col-span-2">
                  <Label>{f.label}</Label>
                  <Textarea rows={2} value={(val as string) ?? ''} onChange={e => setField(f.key, e.target.value)} />
                  {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
                </div>
              );
            }
            if (f.type === 'toggle') {
              return (
                <label key={f.key} className={`${wrap || 'col-span-1'} flex items-center justify-between rounded-md border p-3`}>
                  <div>
                    <div className="text-sm font-medium">{f.label}</div>
                    {f.help && <div className="text-xs text-muted-foreground">{f.help}</div>}
                  </div>
                  <Switch checked={!!val} onCheckedChange={c => setField(f.key, c)} />
                </label>
              );
            }
            if (f.type === 'select') {
              return (
                <div key={f.key} className={wrap}>
                  <Label>{f.label}</Label>
                  <Select value={(val as string) ?? ''} onValueChange={v => setField(f.key, v)}>
                    <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                    <SelectContent>
                      {f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
                </div>
              );
            }
            if (f.type === 'multiselect') {
              const arr = (val as string[]) ?? [];
              return (
                <div key={f.key} className="col-span-2">
                  <Label>{f.label}</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {f.options.map(o => {
                      const on = arr.includes(o.value);
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setField(f.key, on ? arr.filter(v => v !== o.value) : [...arr, o.value])}
                          className={`text-xs px-2.5 py-1 rounded-full border ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                        >{o.label}</button>
                      );
                    })}
                  </div>
                  {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
                </div>
              );
            }
            return null;
          })}

          {extraEditor?.(draft, setDraft)}

          {draft.isSystemDefault && (
            <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> System default — can be renamed or archived, not deleted.
            </div>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.label.trim() || !draft.code.trim()}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
