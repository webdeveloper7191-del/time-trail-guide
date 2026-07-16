import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Heading1, Type as TypeIcon, Image as ImageIcon, MousePointerClick,
  Minus, Move, ArrowUp, ArrowDown, Trash2, Eye, Pencil, Plus, LayoutTemplate,
} from 'lucide-react';

/**
 * Mailchimp-style block email editor.
 * Left: block list with inline editing. Right: live preview.
 * Emits rendered HTML via onChange so downstream code (queued send) works unchanged.
 */

export type EmailBlock =
  | { id: string; type: 'header'; text: string; level: 'h1' | 'h2' }
  | { id: string; type: 'text'; html: string }
  | { id: string; type: 'image'; url: string; alt: string; align: 'left' | 'center' | 'right' }
  | { id: string; type: 'button'; text: string; url: string; align: 'left' | 'center' | 'right' }
  | { id: string; type: 'divider' }
  | { id: string; type: 'spacer'; height: number };

const uid = () => Math.random().toString(36).slice(2, 10);

const STARTER_TEMPLATES: { id: string; label: string; blocks: EmailBlock[] }[] = [
  {
    id: 'blank',
    label: 'Blank',
    blocks: [{ id: uid(), type: 'text', html: 'Hi {{first_name}},<br/><br/>Write your message here.' }],
  },
  {
    id: 'announcement',
    label: 'Announcement',
    blocks: [
      { id: uid(), type: 'header', text: 'Important update', level: 'h1' },
      { id: uid(), type: 'text', html: 'Hi {{first_name}}, we have a quick update for the {{location}} team.' },
      { id: uid(), type: 'button', text: 'View details', url: 'https://', align: 'center' },
    ],
  },
  {
    id: 'reminder',
    label: 'Shift reminder',
    blocks: [
      { id: uid(), type: 'header', text: 'Your next shift', level: 'h2' },
      { id: uid(), type: 'text', html: 'Hi {{first_name}}, this is a reminder for your upcoming shift: {{next_shift}}.' },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'text', html: 'Please confirm in the portal or reply if you cannot attend.' },
    ],
  },
];

function renderBlockHtml(b: EmailBlock): string {
  switch (b.type) {
    case 'header':
      return `<${b.level} style="margin:0 0 12px;font-family:Inter,system-ui,sans-serif;color:#111827;">${escape(b.text)}</${b.level}>`;
    case 'text':
      return `<div style="font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0 0 12px;">${b.html}</div>`;
    case 'image':
      return b.url
        ? `<div style="text-align:${b.align};margin:0 0 12px;"><img src="${b.url}" alt="${escape(b.alt)}" style="max-width:100%;border-radius:6px;"/></div>`
        : '';
    case 'button':
      return `<div style="text-align:${b.align};margin:16px 0;"><a href="${b.url}" style="background:#111827;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:Inter,system-ui,sans-serif;font-size:14px;display:inline-block;">${escape(b.text)}</a></div>`;
    case 'divider':
      return `<hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;"/>`;
    case 'spacer':
      return `<div style="height:${b.height}px;"></div>`;
  }
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function renderEmailHtml(blocks: EmailBlock[]): string {
  const inner = blocks.map(renderBlockHtml).join('\n');
  return `<div style="max-width:600px;margin:0 auto;padding:24px;background:#ffffff;">${inner}</div>`;
}

interface Props {
  value: string; // HTML output (for compatibility with existing email.body)
  onChange: (html: string) => void;
}

export function EmailBlockEditor({ onChange }: Props) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(STARTER_TEMPLATES[0].blocks);
  const [activeId, setActiveId] = useState<string | null>(blocks[0]?.id ?? null);
  const [view, setView] = useState<'edit' | 'preview'>('edit');

  useEffect(() => { onChange(renderEmailHtml(blocks)); }, [blocks, onChange]);

  const active = useMemo(() => blocks.find(b => b.id === activeId) || null, [blocks, activeId]);

  const add = (type: EmailBlock['type']) => {
    let nb: EmailBlock;
    switch (type) {
      case 'header': nb = { id: uid(), type: 'header', text: 'New heading', level: 'h2' }; break;
      case 'text': nb = { id: uid(), type: 'text', html: 'Write something…' }; break;
      case 'image': nb = { id: uid(), type: 'image', url: '', alt: '', align: 'center' }; break;
      case 'button': nb = { id: uid(), type: 'button', text: 'Click here', url: 'https://', align: 'center' }; break;
      case 'divider': nb = { id: uid(), type: 'divider' }; break;
      case 'spacer': nb = { id: uid(), type: 'spacer', height: 24 }; break;
    }
    setBlocks(bs => [...bs, nb]);
    setActiveId(nb.id);
  };

  const update = (id: string, patch: Partial<EmailBlock>) =>
    setBlocks(bs => bs.map(b => (b.id === id ? { ...b, ...patch } as EmailBlock : b)));

  const remove = (id: string) => setBlocks(bs => bs.filter(b => b.id !== id));

  const move = (id: string, dir: -1 | 1) => setBlocks(bs => {
    const i = bs.findIndex(b => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= bs.length) return bs;
    const next = bs.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const loadTemplate = (id: string) => {
    const t = STARTER_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    const cloned = t.blocks.map(b => ({ ...b, id: uid() }));
    setBlocks(cloned);
    setActiveId(cloned[0]?.id ?? null);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-2 py-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          <BlockBtn icon={Heading1} label="Heading" onClick={() => add('header')} />
          <BlockBtn icon={TypeIcon} label="Text" onClick={() => add('text')} />
          <BlockBtn icon={ImageIcon} label="Image" onClick={() => add('image')} />
          <BlockBtn icon={MousePointerClick} label="Button" onClick={() => add('button')} />
          <BlockBtn icon={Minus} label="Divider" onClick={() => add('divider')} />
          <BlockBtn icon={Move} label="Spacer" onClick={() => add('spacer')} />
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={loadTemplate}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <LayoutTemplate className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Templates" />
            </SelectTrigger>
            <SelectContent>
              {STARTER_TEMPLATES.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-md border p-0.5">
            <Button type="button" size="sm" variant={view === 'edit' ? 'secondary' : 'ghost'}
              className="h-7 px-2 text-xs" onClick={() => setView('edit')}>
              <Pencil className="h-3 w-3 mr-1" />Edit
            </Button>
            <Button type="button" size="sm" variant={view === 'preview' ? 'secondary' : 'ghost'}
              className="h-7 px-2 text-xs" onClick={() => setView('preview')}>
              <Eye className="h-3 w-3 mr-1" />Preview
            </Button>
          </div>
        </div>
      </div>

      {view === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-[420px]">
          {/* Canvas */}
          <div className="p-4 bg-muted/20 overflow-auto max-h-[520px]">
            <div className="max-w-[600px] mx-auto bg-background rounded-md border shadow-sm">
              {blocks.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  Add a block from the toolbar to start.
                </div>
              )}
              {blocks.map((b, idx) => (
                <div
                  key={b.id}
                  onClick={() => setActiveId(b.id)}
                  className={cn(
                    'group relative border-b last:border-b-0 px-4 py-3 cursor-pointer',
                    activeId === b.id && 'ring-2 ring-primary/50 bg-primary/5'
                  )}
                >
                  <div className="pointer-events-none" dangerouslySetInnerHTML={{ __html: renderBlockHtml(b) || '<span class="text-xs text-muted-foreground">Empty image block</span>' }} />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-0.5 bg-background border rounded-md shadow-sm">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === 0} onClick={e => { e.stopPropagation(); move(b.id, -1); }}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === blocks.length - 1} onClick={e => { e.stopPropagation(); move(b.id, 1); }}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={e => { e.stopPropagation(); remove(b.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector */}
          <div className="border-l bg-background p-4 space-y-3 overflow-auto max-h-[520px]">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Block settings</div>
            {!active && <p className="text-sm text-muted-foreground">Select a block to edit its content.</p>}
            {active?.type === 'header' && (
              <>
                <Field label="Text">
                  <Input value={active.text} onChange={e => update(active.id, { text: e.target.value })} />
                </Field>
                <Field label="Style">
                  <Select value={active.level} onValueChange={(v: 'h1' | 'h2') => update(active.id, { level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h1">Large (H1)</SelectItem>
                      <SelectItem value="h2">Medium (H2)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
            {active?.type === 'text' && (
              <Field label="Content (HTML allowed)">
                <Textarea rows={8} value={active.html} onChange={e => update(active.id, { html: e.target.value })}
                  placeholder="Merge tags {{first_name}}, {{location}} supported." />
              </Field>
            )}
            {active?.type === 'image' && (
              <>
                <Field label="Image URL"><Input value={active.url} onChange={e => update(active.id, { url: e.target.value })} placeholder="https://…" /></Field>
                <Field label="Alt text"><Input value={active.alt} onChange={e => update(active.id, { alt: e.target.value })} /></Field>
                <Field label="Alignment"><AlignSelect value={active.align} onChange={v => update(active.id, { align: v })} /></Field>
              </>
            )}
            {active?.type === 'button' && (
              <>
                <Field label="Label"><Input value={active.text} onChange={e => update(active.id, { text: e.target.value })} /></Field>
                <Field label="URL"><Input value={active.url} onChange={e => update(active.id, { url: e.target.value })} placeholder="https://…" /></Field>
                <Field label="Alignment"><AlignSelect value={active.align} onChange={v => update(active.id, { align: v })} /></Field>
              </>
            )}
            {active?.type === 'spacer' && (
              <Field label="Height (px)">
                <Input type="number" min={4} max={200} value={active.height}
                  onChange={e => update(active.id, { height: Math.max(4, Number(e.target.value) || 0) })} />
              </Field>
            )}
            {active?.type === 'divider' && (
              <p className="text-sm text-muted-foreground">Divider has no configurable options.</p>
            )}
            {active && (
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => add(active.type)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Duplicate block type
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-muted/20 max-h-[560px] overflow-auto">
          <div className="mx-auto" dangerouslySetInnerHTML={{ __html: renderEmailHtml(blocks) }} />
        </div>
      )}
    </div>
  );
}

function BlockBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1" onClick={onClick}>
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function AlignSelect({ value, onChange }: { value: 'left' | 'center' | 'right'; onChange: (v: 'left' | 'center' | 'right') => void }) {
  return (
    <Select value={value} onValueChange={(v: any) => onChange(v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="left">Left</SelectItem>
        <SelectItem value="center">Center</SelectItem>
        <SelectItem value="right">Right</SelectItem>
      </SelectContent>
    </Select>
  );
}
