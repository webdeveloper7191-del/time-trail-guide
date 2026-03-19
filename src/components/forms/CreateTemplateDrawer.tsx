import { useState, useMemo } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection, FormField, FormRow, FormQuestionLabel } from '@/components/ui/off-canvas/FormSection';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Search, FileText, Globe, Building2, MapPin, Copy, Plus, Shield, Sparkles, Wrench, AlertTriangle, ArrowLeftRight, ClipboardCheck, GraduationCap, Eye } from 'lucide-react';
import { FormTemplate, FORM_CATEGORIES, FormTemplateScope } from '@/types/forms';
import { mockCentres } from '@/data/mockRosterData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CreateTemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  systemTemplates: FormTemplate[];
  onCreateFromScratch: (config: { name: string; description: string; category: string; scope: FormTemplateScope; locationId?: string; locationName?: string }) => void;
  onCreateFromSystemTemplate: (template: FormTemplate, config: { name: string; scope: FormTemplateScope; locationId?: string; locationName?: string }) => void;
  onPreviewTemplate: (template: FormTemplate) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  safety: <Shield className="h-4 w-4" />,
  cleaning: <Sparkles className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  incident: <AlertTriangle className="h-4 w-4" />,
  handover: <ArrowLeftRight className="h-4 w-4" />,
  inspection: <ClipboardCheck className="h-4 w-4" />,
  training: <GraduationCap className="h-4 w-4" />,
  custom: <FileText className="h-4 w-4" />,
};

export function CreateTemplateDrawer({
  open,
  onClose,
  systemTemplates,
  onCreateFromScratch,
  onCreateFromSystemTemplate,
  onPreviewTemplate,
}: CreateTemplateDrawerProps) {
  const [creationMode, setCreationMode] = useState<'scratch' | 'system'>('scratch');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [scope, setScope] = useState<FormTemplateScope>('tenant');
  const [locationId, setLocationId] = useState('');
  const [selectedSystemTemplate, setSelectedSystemTemplate] = useState<FormTemplate | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');

  const filteredSystemTemplates = useMemo(() => {
    if (!templateSearch) return systemTemplates;
    const q = templateSearch.toLowerCase();
    return systemTemplates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [systemTemplates, templateSearch]);

  const selectedLocation = mockCentres.find(c => c.id === locationId);

  const resetForm = () => {
    setCreationMode('scratch');
    setName('');
    setDescription('');
    setCategory('custom');
    setScope('tenant');
    setLocationId('');
    setSelectedSystemTemplate(null);
    setTemplateSearch('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canSubmit = () => {
    if (creationMode === 'scratch') {
      return name.trim().length > 0 && (scope !== 'location' || locationId);
    }
    return selectedSystemTemplate && (scope !== 'location' || locationId);
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    const locationName = selectedLocation?.name;

    if (creationMode === 'scratch') {
      onCreateFromScratch({
        name: name.trim(),
        description: description.trim(),
        category,
        scope,
        locationId: scope === 'location' ? locationId : undefined,
        locationName: scope === 'location' ? locationName : undefined,
      });
    } else if (selectedSystemTemplate) {
      onCreateFromSystemTemplate(selectedSystemTemplate, {
        name: name.trim() || `${selectedSystemTemplate.name} (Custom)`,
        scope,
        locationId: scope === 'location' ? locationId : undefined,
        locationName: scope === 'location' ? locationName : undefined,
      });
    }

    handleClose();
  };

  const getCategoryLabel = (id: string) => FORM_CATEGORIES.find(c => c.id === id)?.label || id;

  return (
    <PrimaryOffCanvas
      title="Create Template"
      description="Create a new form template from scratch or use a system template"
      icon={Plus}
      size="lg"
      open={open}
      onClose={handleClose}
      isBackground
      showFooter
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: handleClose },
        { label: creationMode === 'scratch' ? 'Create Template' : 'Use Template', variant: 'primary', onClick: handleSubmit, disabled: !canSubmit() },
      ]}
    >
      {/* Creation Mode */}
      <FormQuestionLabel question="How would you like to create this template?" required />
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setCreationMode('scratch'); setSelectedSystemTemplate(null); }}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-left",
            creationMode === 'scratch'
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className={cn(
            "p-2.5 rounded-full",
            creationMode === 'scratch' ? "bg-primary/10" : "bg-muted"
          )}>
            <Plus className={cn("h-5 w-5", creationMode === 'scratch' ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">From Scratch</p>
            <p className="text-xs text-muted-foreground mt-0.5">Build a blank template</p>
          </div>
        </button>
        <button
          onClick={() => setCreationMode('system')}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-left",
            creationMode === 'system'
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className={cn(
            "p-2.5 rounded-full",
            creationMode === 'system' ? "bg-primary/10" : "bg-muted"
          )}>
            <Copy className={cn("h-5 w-5", creationMode === 'system' ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">From System Template</p>
            <p className="text-xs text-muted-foreground mt-0.5">Customize a pre-built template</p>
          </div>
        </button>
      </div>

      {/* Scope Selection */}
      <FormSection title="Template Scope" tooltip="Determines who can access and use this template">
        <RadioGroup value={scope} onValueChange={(v) => { setScope(v as FormTemplateScope); if (v !== 'location') setLocationId(''); }}>
          <div className="space-y-2">
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
              scope === 'tenant' ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            )}>
              <RadioGroupItem value="tenant" id="scope-tenant" className="mt-0.5" />
              <Label htmlFor="scope-tenant" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-foreground">Tenant Level</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Available across all locations in your organization</p>
              </Label>
            </div>
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
              scope === 'location' ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            )}>
              <RadioGroupItem value="location" id="scope-location" className="mt-0.5" />
              <Label htmlFor="scope-location" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-foreground">Location Specific</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Only available at a specific location</p>
              </Label>
            </div>
          </div>
        </RadioGroup>

        {/* Location Selector - shown when location scope is selected */}
        {scope === 'location' && (
          <FormField label="Select Location" required>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a location..." />
              </SelectTrigger>
              <SelectContent>
                {mockCentres.map(centre => (
                  <SelectItem key={centre.id} value={centre.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{centre.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </FormSection>

      {/* From Scratch - Template Details */}
      {creationMode === 'scratch' && (
        <FormSection title="Template Details">
          <FormField label="Template Name" required>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Daily Safety Checklist"
              maxLength={100}
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this template's purpose..."
              rows={3}
              maxLength={500}
            />
          </FormField>
          <FormField label="Category" required>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {categoryIcons[cat.id]}
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>
      )}

      {/* From System Template - Browse & Select */}
      {creationMode === 'system' && (
        <FormSection title="Select System Template" tooltip="Choose a pre-built template to customize for your organization">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={templateSearch}
              onChange={e => setTemplateSearch(e.target.value)}
              placeholder="Search system templates..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {filteredSystemTemplates.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No system templates found</p>
              </div>
            ) : (
              filteredSystemTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => { setSelectedSystemTemplate(tmpl); setName(`${tmpl.name} (Custom)`); }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    selectedSystemTemplate?.id === tmpl.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {categoryIcons[tmpl.category]}
                        <span className="text-sm font-medium text-foreground truncate">{tmpl.name}</span>
                      </div>
                      {tmpl.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tmpl.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(tmpl.category)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{tmpl.fields.length} fields</span>
                        <span className="text-xs text-muted-foreground">v{tmpl.version}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPreviewTemplate(tmpl); }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Custom name for the duplicated template */}
          {selectedSystemTemplate && (
            <FormField label="Custom Template Name">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`${selectedSystemTemplate.name} (Custom)`}
              />
            </FormField>
          )}
        </FormSection>
      )}
    </PrimaryOffCanvas>
  );
}
