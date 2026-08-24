import { useMemo, useState } from 'react';
import { Search, Plus, FileText, MoreVertical, Eye, Edit, Copy, Archive, Upload, Globe, CheckCircle2, Layers, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormTemplate, FORM_CATEGORIES } from '@/types/forms';
import { FORM_INDUSTRIES, getTemplateIndustry, getIndustryLabel } from '@/lib/formIndustry';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SystemFormLibraryPageProps {
  templates: FormTemplate[];
  onTemplatesChange: (templates: FormTemplate[]) => void;
  onSelectTemplate: (template: FormTemplate) => void;
  onPreviewTemplate: (template: FormTemplate) => void;
  onCreateNew: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function SystemFormLibraryPage({
  templates,
  onTemplatesChange,
  onSelectTemplate,
  onPreviewTemplate,
  onCreateNew,
  searchQuery,
  onSearchChange,
}: SystemFormLibraryPageProps) {
  const [activeIndustry, setActiveIndustry] = useState<string>('all');

  const systemTemplates = useMemo(
    () => templates.filter(t => t.scope === 'system'),
    [templates]
  );

  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    systemTemplates.forEach(t => {
      const ind = getTemplateIndustry(t);
      counts[ind] = (counts[ind] || 0) + 1;
    });
    return counts;
  }, [systemTemplates]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return systemTemplates.filter(t => {
      const matchesSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      const matchesIndustry = activeIndustry === 'all' || getTemplateIndustry(t) === activeIndustry;
      return matchesSearch && matchesIndustry;
    });
  }, [systemTemplates, searchQuery, activeIndustry]);

  const stats = useMemo(() => ({
    total: systemTemplates.length,
    published: systemTemplates.filter(t => t.status === 'published').length,
    draft: systemTemplates.filter(t => t.status === 'draft').length,
    industries: Object.keys(industryCounts).length,
  }), [systemTemplates, industryCounts]);

  const updateTemplate = (id: string, updates: Partial<FormTemplate>) => {
    onTemplatesChange(templates.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)));
  };

  const handlePublish = (t: FormTemplate) => {
    updateTemplate(t.id, { status: 'published', publishedAt: new Date().toISOString() });
    toast.success(`"${t.name}" published to the industry library`);
  };

  const handleDuplicate = (t: FormTemplate) => {
    const copy: FormTemplate = {
      ...t,
      id: `template-${Date.now()}`,
      name: `${t.name} (Copy)`,
      status: 'draft',
      version: 1,
      duplicatedFrom: t.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onTemplatesChange([copy, ...templates]);
    toast.success('Industry template duplicated');
  };

  const getCategoryLabel = (id: string) => FORM_CATEGORIES.find(c => c.id === id)?.label || id;

  const statCards = [
    { label: 'Industry Templates', value: stats.total, sub: 'System library', icon: <Globe className="h-5 w-5" />, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Published', value: stats.published, sub: 'Available to tenants', icon: <CheckCircle2 className="h-5 w-5" />, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { label: 'Drafts', value: stats.draft, sub: 'Not yet released', icon: <Edit className="h-5 w-5" />, bg: 'bg-amber-100', color: 'text-amber-600' },
    { label: 'Industries Covered', value: stats.industries, sub: 'Distinct sectors', icon: <Layers className="h-5 w-5" />, bg: 'bg-primary/10', color: 'text-primary' },
  ];

  return (
    <div className="flex flex-col h-full bg-muted/30 overflow-auto">
      <div className="px-6 pt-5">
        <div className="rounded-xl border border-border bg-background p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">System Admin · Industry Template Authoring</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Build the master catalogue of forms per industry. Published templates become installable by tenant admins.
            </p>
          </div>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-1" /> New Industry Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 pt-4 pb-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
            <div className={cn('p-2 rounded-full', s.bg, s.color)}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="px-6 border-b border-border">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {[{ id: 'all', label: 'All Industries' }, ...FORM_INDUSTRIES].map(ind => {
            const count = ind.id === 'all' ? systemTemplates.length : industryCounts[ind.id] || 0;
            return (
              <button
                key={ind.id}
                onClick={() => setActiveIndustry(ind.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeIndustry === ind.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {ind.label}
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center',
                  activeIndustry === ind.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {String(count).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search industry templates"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="border border-border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-foreground">Template Name</TableHead>
                <TableHead className="font-semibold text-foreground">Industry</TableHead>
                <TableHead className="font-semibold text-foreground">Category</TableHead>
                <TableHead className="font-semibold text-foreground">Fields</TableHead>
                <TableHead className="font-semibold text-foreground">Version</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Updated</TableHead>
                <TableHead className="font-semibold text-foreground w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectTemplate(t)}>
                  <TableCell>
                    <p className="font-medium text-foreground">{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{getIndustryLabel(getTemplateIndustry(t))}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getCategoryLabel(t.category)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.fields.length}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">v{t.version}</TableCell>
                  <TableCell>
                    {t.status === 'published' ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Published</Badge>
                    ) : t.status === 'draft' ? (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">Draft</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(t.updatedAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPreviewTemplate(t)}><Eye className="h-4 w-4 mr-2" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSelectTemplate(t)}><Edit className="h-4 w-4 mr-2" /> Edit template</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(t)}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {t.status !== 'published' && (
                          <DropdownMenuItem onClick={() => handlePublish(t)}><Upload className="h-4 w-4 mr-2" /> Publish to library</DropdownMenuItem>
                        )}
                        {t.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => { updateTemplate(t.id, { status: 'archived' }); toast.success('Template archived'); }}>
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { onTemplatesChange(templates.filter(x => x.id !== t.id)); toast.success('Template deleted'); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-base font-medium text-muted-foreground">No industry templates found</p>
              <p className="text-sm text-muted-foreground mt-1">Create one or adjust your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
