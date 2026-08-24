import { useMemo, useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormTemplate, FORM_CATEGORIES } from '@/types/forms';
import { FORM_INDUSTRIES, getTemplateIndustry, getIndustryLabel } from '@/lib/formIndustry';
import { Download, Search, Eye, PackagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstallTemplatesPanelProps {
  open: boolean;
  onClose: () => void;
  systemTemplates: FormTemplate[];
  installedFromIds: string[];
  onInstall: (templates: FormTemplate[]) => void;
  onPreview: (template: FormTemplate) => void;
}

export function InstallTemplatesPanel({
  open,
  onClose,
  systemTemplates,
  installedFromIds,
  onInstall,
  onPreview,
}: InstallTemplatesPanelProps) {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = useMemo(() => {
    const q = search.toLowerCase();
    return systemTemplates
      .filter(t => t.status !== 'archived')
      .filter(t => !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .filter(t => industry === 'all' || getTemplateIndustry(t) === industry);
  }, [systemTemplates, search, industry]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleInstall = () => {
    onInstall(systemTemplates.filter(t => selected.has(t.id)));
    setSelected(new Set());
    onClose();
  };

  const getCategoryLabel = (id: string) => FORM_CATEGORIES.find(c => c.id === id)?.label || id;

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Install from Industry Library"
      description="Pick system templates to copy into your organisation. Installed copies stay editable."
      icon={PackagePlus}
      size="lg"
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        {
          label: `Install ${selected.size > 0 ? `(${selected.size})` : ''}`.trim(),
          variant: 'primary',
          onClick: handleInstall,
          disabled: selected.size === 0,
          icon: <Download className="h-4 w-4" />,
        },
      ]}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search library" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {FORM_INDUSTRIES.map(i => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {available.map(t => {
          const alreadyInstalled = installedFromIds.includes(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border border-border p-3 bg-background',
                selected.has(t.id) && 'border-primary bg-primary/5'
              )}
            >
              <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggle(t.id)} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <Badge variant="outline" className="text-[11px]">{getIndustryLabel(getTemplateIndustry(t))}</Badge>
                  <Badge variant="secondary" className="text-[11px]">{getCategoryLabel(t.category)}</Badge>
                  {alreadyInstalled && (
                    <Badge className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">Installed</Badge>
                  )}
                </div>
                {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">{t.fields.length} fields · v{t.version}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onPreview(t)}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {available.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No templates match your filters.</p>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}
