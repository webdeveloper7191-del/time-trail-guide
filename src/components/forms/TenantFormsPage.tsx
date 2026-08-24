import { useMemo, useState } from 'react';
import { Search, Plus, FileText, MoreVertical, Eye, Edit, Copy, Trash2, Archive, Power, PowerOff, Building2, MapPin, CheckCircle2, PackagePlus, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormTemplate, FORM_CATEGORIES } from '@/types/forms';
import { getIndustryLabel, getTemplateIndustry } from '@/lib/formIndustry';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabFilter = 'all' | 'installed' | 'custom' | 'location' | 'published' | 'draft';

interface TenantFormsPageProps {
  templates: FormTemplate[];
  onTemplatesChange: (templates: FormTemplate[]) => void;
  onSelectTemplate: (template: FormTemplate) => void;
  onPreviewTemplate: (template: FormTemplate) => void;
  onCreateNew: () => void;
  onOpenInstall: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function TenantFormsPage({
  templates,
  onTemplatesChange,
  onSelectTemplate,
  onPreviewTemplate,
  onCreateNew,
  onOpenInstall,
  searchQuery,
  onSearchChange,
}: TenantFormsPageProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const tenantTemplates = useMemo(
    () => templates.filter(t => t.scope !== 'system'),
    [templates]
  );

  const stats = useMemo(() => ({
    total: tenantTemplates.length,
    installed: tenantTemplates.filter(t => !!t.installedFromId).length,
    custom: tenantTemplates.filter(t => !t.installedFromId).length,
    location: tenantTemplates.filter(t => t.scope === 'location').length,
    published: tenantTemplates.filter(t => t.status === 'published').length,
    draft: tenantTemplates.filter(t => t.status === 'draft').length,
  }), [tenantTemplates]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tenantTemplates.filter(t => {
      const matchesSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      let matchesTab = true;
      if (activeTab === 'installed') matchesTab = !!t.installedFromId;
      else if (activeTab === 'custom') matchesTab = !t.installedFromId;
      else if (activeTab === 'location') matchesTab = t.scope === 'location';
      else if (activeTab === 'published') matchesTab = t.status === 'published';
      else if (activeTab === 'draft') matchesTab = t.status === 'draft';
      return matchesSearch && matchesTab;
    });
  }, [tenantTemplates, searchQuery, activeTab]);

  const update = (id: string, updates: Partial<FormTemplate>) =>
    onTemplatesChange(templates.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)));

  const handleDuplicate = (t: FormTemplate) => {
    onTemplatesChange([{
      ...t,
      id: `template-${Date.now()}`,
      name: `${t.name} (Copy)`,
      status: 'draft',
      version: 1,
      duplicatedFrom: t.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, ...templates]);
    toast.success('Template duplicated');
  };

  const getCategoryLabel = (id: string) => FORM_CATEGORIES.find(c => c.id === id)?.label || id;

  const statCards = [
    { label: 'My Templates', value: stats.total, sub: 'Tenant + location', icon: <FileText className="h-5 w-5" />, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Installed', value: stats.installed, sub: 'From industry library', icon: <Download className="h-5 w-5" />, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Custom Built', value: stats.custom, sub: 'Created in-house', icon: <Building2 className="h-5 w-5" />, bg: 'bg-teal-100', color: 'text-teal-600' },
    { label: 'Published', value: stats.published, sub: 'Ready to assign', icon: <CheckCircle2 className="h-5 w-5" />, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  ];

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'installed', label: 'Installed', count: stats.installed },
    { key: 'custom', label: 'Custom', count: stats.custom },
    { key: 'location', label: 'Location Specific', count: stats.location },
    { key: 'published', label: 'Published', count: stats.published },
    { key: 'draft', label: 'Draft', count: stats.draft },
  ];

  return (
    <div className="flex flex-col h-full bg-muted/30 overflow-auto">
      <div className="px-6 pt-5">
        <div className="rounded-xl border border-border bg-background p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Tenant Admin · Your Form Templates</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Install industry templates and customise them, or build your own from scratch.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenInstall}>
              <PackagePlus className="h-4 w-4 mr-1" /> Install from Library
            </Button>
            <Button size="sm" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-1" /> Create Template
            </Button>
          </div>
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
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center',
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {String(tab.count).padStart(2, '0')}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search your templates" value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="border border-border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-foreground">Template Name</TableHead>
                <TableHead className="font-semibold text-foreground">Source</TableHead>
                <TableHead className="font-semibold text-foreground">Category</TableHead>
                <TableHead className="font-semibold text-foreground">Scope</TableHead>
                <TableHead className="font-semibold text-foreground">Fields</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Updated</TableHead>
                <TableHead className="font-semibold text-foreground w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow
                  key={t.id}
                  className={cn('cursor-pointer hover:bg-muted/50', t.isEnabled === false && 'opacity-60')}
                  onClick={() => onSelectTemplate(t)}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>}
                  </TableCell>
                  <TableCell>
                    {t.installedFromId ? (
                      <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                        <Download className="h-3 w-3" /> {getIndustryLabel(getTemplateIndustry(t))}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getCategoryLabel(t.category)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('gap-1 text-xs', t.scope === 'location' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}>
                      {t.scope === 'location' ? <MapPin className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      {t.scope === 'location' ? (t.locationName || 'Location') : 'Tenant'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.fields.length}</TableCell>
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
                        <DropdownMenuItem onClick={() => onSelectTemplate(t)}><Edit className="h-4 w-4 mr-2" /> Customise</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(t)}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { update(t.id, { isEnabled: t.isEnabled === false }); toast.success(t.isEnabled === false ? 'Template enabled' : 'Template disabled'); }}>
                          {t.isEnabled !== false ? <><PowerOff className="h-4 w-4 mr-2" /> Disable</> : <><Power className="h-4 w-4 mr-2" /> Enable</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { update(t.id, { status: 'archived' }); toast.success('Template archived'); }}>
                          <Archive className="h-4 w-4 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => { onTemplatesChange(templates.filter(x => x.id !== t.id)); toast.success('Template deleted'); }}>
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
              <p className="text-base font-medium text-muted-foreground">No templates yet</p>
              <p className="text-sm text-muted-foreground mt-1">Install one from the industry library or create your own</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
