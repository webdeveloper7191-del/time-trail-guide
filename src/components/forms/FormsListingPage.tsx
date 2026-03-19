import { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, Plus, FileText, MoreVertical, Eye, Edit, Copy, Trash2, Archive, Power, PowerOff, Shield, Sparkles, Wrench, AlertTriangle, ArrowLeftRight, ClipboardCheck, GraduationCap, Building2, Globe, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormTemplate, FORM_CATEGORIES, FormTemplateScope } from '@/types/forms';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DuplicateTemplateModal } from './DuplicateTemplateModal';

const categoryIcons: Record<string, React.ReactNode> = {
  safety: <Shield className="h-3.5 w-3.5" />,
  cleaning: <Sparkles className="h-3.5 w-3.5" />,
  maintenance: <Wrench className="h-3.5 w-3.5" />,
  incident: <AlertTriangle className="h-3.5 w-3.5" />,
  handover: <ArrowLeftRight className="h-3.5 w-3.5" />,
  inspection: <ClipboardCheck className="h-3.5 w-3.5" />,
  training: <GraduationCap className="h-3.5 w-3.5" />,
  custom: <FileText className="h-3.5 w-3.5" />,
};

const scopeConfig: Record<FormTemplateScope, { label: string; icon: React.ReactNode; color: string }> = {
  system: { label: 'System', icon: <Globe className="h-3.5 w-3.5" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  tenant: { label: 'Tenant', icon: <Building2 className="h-3.5 w-3.5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  location: { label: 'Location', icon: <MapPin className="h-3.5 w-3.5" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

type TabFilter = 'all' | 'system' | 'tenant' | 'location' | 'published' | 'draft' | 'archived';

interface FormsListingPageProps {
  templates: FormTemplate[];
  onTemplatesChange: (templates: FormTemplate[]) => void;
  onSelectTemplate: (template: FormTemplate) => void;
  onPreviewTemplate: (template: FormTemplate) => void;
  onCreateNew: () => void;
  onCreateFromSystemTemplate: (template: FormTemplate) => void;
}

export function FormsListingPage({
  templates,
  onTemplatesChange,
  onSelectTemplate,
  onPreviewTemplate,
  onCreateNew,
  onCreateFromSystemTemplate,
}: FormsListingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<FormTemplate | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = templates.length;
    const system = templates.filter(t => t.scope === 'system').length;
    const tenant = templates.filter(t => t.scope === 'tenant').length;
    const location = templates.filter(t => t.scope === 'location').length;
    const published = templates.filter(t => t.status === 'published').length;
    const draft = templates.filter(t => t.status === 'draft').length;
    const archived = templates.filter(t => t.status === 'archived').length;
    const totalFields = templates.reduce((sum, t) => sum + t.fields.length, 0);
    return { total, system, tenant, location, published, draft, archived, totalFields };
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesTab = true;
      if (activeTab === 'system') matchesTab = t.scope === 'system';
      else if (activeTab === 'tenant') matchesTab = t.scope === 'tenant';
      else if (activeTab === 'location') matchesTab = t.scope === 'location';
      else if (activeTab === 'published') matchesTab = t.status === 'published';
      else if (activeTab === 'draft') matchesTab = t.status === 'draft';
      else if (activeTab === 'archived') matchesTab = t.status === 'archived';

      return matchesSearch && matchesTab;
    });
  }, [templates, searchQuery, activeTab]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredTemplates.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedIds(next);
  };

  const handleDelete = (id: string) => {
    onTemplatesChange(templates.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const handleArchive = (id: string) => {
    onTemplatesChange(templates.map(t => t.id === id ? { ...t, status: 'archived' as const } : t));
    toast.success('Template archived');
  };

  const handleToggleEnabled = (id: string) => {
    onTemplatesChange(templates.map(t => {
      if (t.id === id) {
        const newEnabled = !t.isEnabled;
        toast.success(newEnabled ? 'Template enabled' : 'Template disabled');
        return { ...t, isEnabled: newEnabled };
      }
      return t;
    }));
  };

  const handleDuplicate = (template: FormTemplate) => {
    setTemplateToDuplicate(template);
    setDuplicateModalOpen(true);
  };

  const handleDuplicateComplete = (newTemplate: FormTemplate) => {
    onTemplatesChange([newTemplate, ...templates]);
  };

  const getCategoryLabel = (id: string) => FORM_CATEGORIES.find(c => c.id === id)?.label || id;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Published</Badge>;
      case 'draft': return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">Draft</Badge>;
      case 'archived': return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const tabs: { key: TabFilter; label: string; count: number; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'All Templates', count: stats.total, icon: <FileText className="h-4 w-4" /> },
    { key: 'system', label: 'System Templates', count: stats.system, icon: <Globe className="h-4 w-4" /> },
    { key: 'tenant', label: 'Tenant Templates', count: stats.tenant, icon: <Building2 className="h-4 w-4" /> },
    { key: 'location', label: 'Location Templates', count: stats.location, icon: <MapPin className="h-4 w-4" /> },
    { key: 'published', label: 'Published', count: stats.published },
    { key: 'draft', label: 'Draft', count: stats.draft },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 px-6 pt-5 pb-4">
        {[
          { label: 'Total Templates', value: stats.total, icon: <FileText className="h-4 w-4 text-primary" /> },
          { label: 'System Templates', value: stats.system, icon: <Globe className="h-4 w-4 text-blue-500" /> },
          { label: 'Tenant Templates', value: stats.tenant, icon: <Building2 className="h-4 w-4 text-emerald-500" /> },
          { label: 'Published', value: stats.published, icon: <ClipboardCheck className="h-4 w-4 text-green-500" /> },
          { label: 'Draft', value: stats.draft, icon: <Edit className="h-4 w-4 text-amber-500" /> },
          { label: 'Archived', value: stats.archived, icon: <Archive className="h-4 w-4 text-muted-foreground" /> },
          { label: 'Total Fields', value: stats.totalFields, icon: <FileText className="h-4 w-4 text-violet-500" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-background rounded-lg border border-border p-3 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
            </div>
            <div className="p-1.5 rounded-full bg-muted/50">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn(
                "ml-1 text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + Filters + Actions */}
      <div className="flex items-center gap-3 px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name and category"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" /> Filter <ChevronDown className="h-3.5 w-3.5 ml-1" />
        </Button>
        {selectedIds.size > 0 && (
          <Button variant="outline" size="sm">
            Bulk Actions <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="border border-border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">
                  <Checkbox
                    checked={filteredTemplates.length > 0 && selectedIds.size === filteredTemplates.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold">Template Name</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Scope</TableHead>
                <TableHead className="font-semibold">Fields</TableHead>
                <TableHead className="font-semibold">Version</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created By</TableHead>
                <TableHead className="font-semibold">Updated</TableHead>
                <TableHead className="font-semibold w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map(template => {
                const scope = scopeConfig[template.scope];
                return (
                  <TableRow
                    key={template.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      template.isEnabled === false && 'opacity-60'
                    )}
                    onClick={() => {
                      if (template.scope === 'system') {
                        onCreateFromSystemTemplate(template);
                      } else {
                        onSelectTemplate(template);
                      }
                    }}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(template.id)}
                        onCheckedChange={(checked) => handleSelectOne(template.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{template.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {categoryIcons[template.category]}
                        <span>{getCategoryLabel(template.category)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1 text-xs", scope.color)}>
                        {scope.icon}
                        {scope.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {template.fields.length}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      v{template.version}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(template.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {template.createdByName || template.createdBy || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onPreviewTemplate(template)}>
                            <Eye className="h-4 w-4 mr-2" /> Preview
                          </DropdownMenuItem>
                          {template.scope !== 'system' && (
                            <DropdownMenuItem onClick={() => onSelectTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" /> Duplicate & Customize
                          </DropdownMenuItem>
                          {template.scope === 'system' && (
                            <DropdownMenuItem onClick={() => onCreateFromSystemTemplate(template)}>
                              <Plus className="h-4 w-4 mr-2" /> Use as Template
                            </DropdownMenuItem>
                          )}
                          {template.scope !== 'system' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleEnabled(template.id)}>
                                {template.isEnabled !== false
                                  ? <><PowerOff className="h-4 w-4 mr-2" /> Disable</>
                                  : <><Power className="h-4 w-4 mr-2" /> Enable</>
                                }
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchive(template.id)}>
                                <Archive className="h-4 w-4 mr-2" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-base font-medium text-muted-foreground">No templates found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Modal */}
      <DuplicateTemplateModal
        open={duplicateModalOpen}
        onOpenChange={setDuplicateModalOpen}
        template={templateToDuplicate}
        onDuplicate={handleDuplicateComplete}
      />
    </div>
  );
}
