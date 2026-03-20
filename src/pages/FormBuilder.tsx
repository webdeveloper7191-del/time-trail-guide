import { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  IconButton, 
  Drawer,
  Divider,
  Button as MuiButton,
  Alert,
  Tooltip,
  Chip,
} from '@mui/material';
import { SurveyJSCreator } from '@/components/forms/SurveyJSCreator';
import { SurveyJSRenderer } from '@/components/forms/SurveyJSRenderer';
import { FormAssignmentRules } from '@/components/forms/FormAssignmentRules';
import { SubmissionWorkflow } from '@/components/forms/SubmissionWorkflow';
import { FormAnalyticsDashboard } from '@/components/forms/FormAnalyticsDashboard';
import { TaskManagementPanel } from '@/components/forms/TaskManagementPanel';
import { OfflineSyncStatusBar } from '@/components/forms/OfflineSyncStatusBar';
import { FormVersionHistoryPanel } from '@/components/forms/FormVersionHistoryPanel';
import { FieldTemplatesLibrary } from '@/components/forms/FieldTemplatesLibrary';
import { CustomTokenManager } from '@/components/forms/CustomTokenManager';
import { FormSettingsDrawer } from '@/components/forms/FormSettingsDrawer';
import { EditTemplateDetailsDrawer } from '@/components/forms/EditTemplateDetailsDrawer';
import { CreateTemplateDrawer } from '@/components/forms/CreateTemplateDrawer';
import { FormsListingPage } from '@/components/forms/FormsListingPage';
import { FormTemplate, FormField, FormSection, FieldType, FIELD_TYPES, AutoPopulateToken, FormTemplateScope } from '@/types/forms';
import { mockFormTemplates } from '@/data/mockFormData';
import { useFormBuilderUndoRedo } from '@/hooks/useFormBuilderUndoRedo';
import { 
  ArrowLeft, 
  Send, 
  Eye, 
  ClipboardCheck, 
  BarChart3, 
  ListTodo, 
  Save, 
  Upload, 
  Users, 
  Check, 
  History, 
  Pencil,
  X,
  AlertCircle,
  Undo2,
  Redo2,
  Bookmark,
  Braces,
  Settings,
  Plus,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ViewMode = 'library' | 'builder' | 'preview' | 'assignments' | 'submissions' | 'analytics' | 'tasks';

export default function FormBuilder() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [templates, setTemplates] = useState<FormTemplate[]>(
    mockFormTemplates.map(t => ({
      ...t,
      scope: t.scope || 'tenant',
      isEnabled: t.isEnabled ?? true,
      isIndustryTemplate: t.isIndustryTemplate ?? (t.scope === 'system'),
    }))
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showEditDetailsPanel, setShowEditDetailsPanel] = useState(false);
  const [showFieldTemplates, setShowFieldTemplates] = useState(false);
  const [showCustomTokens, setShowCustomTokens] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [customTokens, setCustomTokens] = useState<AutoPopulateToken[]>([]);
  const [targetSubmissionId, setTargetSubmissionId] = useState<string | null>(null);
  const [targetTaskId, setTargetTaskId] = useState<string | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const handleNavigateToSubmission = (submissionId: string) => {
    setTargetSubmissionId(submissionId);
    setViewMode('submissions');
  };

  const handleNavigateToTask = (taskId: string) => {
    setTargetTaskId(taskId);
    setViewMode('tasks');
  };

  const handleViewModeChange = (newMode: ViewMode) => {
    if (viewMode === 'submissions' && newMode !== 'submissions') setTargetSubmissionId(null);
    if (viewMode === 'tasks' && newMode !== 'tasks') setTargetTaskId(null);
    setViewMode(newMode);
  };

  // Undo/Redo for template state
  const {
    state: template,
    setState: setTemplate,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFormBuilderUndoRedo<FormTemplate>(mockFormTemplates[0]);

  const selectedField = useMemo(() => {
    if (!selectedFieldId || !template?.fields) return null;
    return template.fields.find(f => f.id === selectedFieldId) || null;
  }, [selectedFieldId, template?.fields]);

  const createNewTemplate = (): FormTemplate => ({
    id: `template-${Date.now()}`,
    name: 'New Form Template',
    description: '',
    category: 'custom',
    version: 1,
    status: 'draft',
    scope: 'tenant',
    sections: [{ id: 'section-1', title: 'Section 1', order: 0 }],
    fields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleAddField = (fieldType: FieldType) => {
    const fieldDef = FIELD_TYPES.find(f => f.type === fieldType);
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      label: fieldDef?.label || 'New Field',
      required: false,
      order: template.fields.length,
      sectionId: template.sections[0]?.id,
    };
    if (['dropdown', 'multi_select', 'radio'].includes(fieldType)) {
      newField.options = [
        { id: 'opt-1', label: 'Option 1', value: 'option_1' },
        { id: 'opt-2', label: 'Option 2', value: 'option_2' },
      ];
    }
    setTemplate(prev => ({ ...prev, fields: [...prev.fields, newField] }));
    setSelectedFieldId(newField.id);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
    }));
  };

  const handleSelectTemplate = (selectedTemplate: FormTemplate) => {
    setTemplate(selectedTemplate);
    setViewMode('builder');
    setSelectedFieldId(null);
  };

  const handlePreviewTemplate = (templateToPreview: FormTemplate) => {
    setPreviewTemplate(templateToPreview);
    setViewMode('preview');
  };

  const handleCreateNew = () => {
    setShowCreateDrawer(true);
  };

  const handleCreateFromScratch = (config: { name: string; description: string; category: string; scope: FormTemplateScope; locationId?: string; locationName?: string }) => {
    const newTemplate: FormTemplate = {
      id: `template-${Date.now()}`,
      name: config.name,
      description: config.description,
      category: config.category,
      version: 1,
      status: 'draft',
      scope: config.scope,
      locationId: config.locationId,
      locationName: config.locationName,
      sections: [{ id: 'section-1', title: 'Section 1', order: 0 }],
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      createdByName: 'Current User',
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setTemplate(newTemplate);
    setViewMode('builder');
    setSelectedFieldId(null);
    toast.success(`Template "${config.name}" created`);
  };

  const handleCreateFromSystemTemplate = (systemTemplate: FormTemplate, config?: { name: string; scope: FormTemplateScope; locationId?: string; locationName?: string }) => {
    const newTemplate: FormTemplate = {
      ...systemTemplate,
      id: `template-${Date.now()}`,
      name: config?.name || `${systemTemplate.name} (Custom)`,
      scope: config?.scope || 'tenant',
      locationId: config?.locationId,
      locationName: config?.locationName,
      status: 'draft',
      isIndustryTemplate: false,
      duplicatedFrom: systemTemplate.id,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      createdByName: 'Current User',
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setTemplate(newTemplate);
    setViewMode('builder');
    setSelectedFieldId(null);
    toast.success(`Created form from system template "${systemTemplate.name}"`);
  };

  const handleSaveTemplate = () => {
    const updatedTemplate = { ...template, updatedAt: new Date().toISOString() };
    setTemplate(updatedTemplate);
    setTemplates(prev => {
      const exists = prev.find(t => t.id === updatedTemplate.id);
      return exists
        ? prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
        : [...prev, updatedTemplate];
    });
    toast.success('Template saved successfully');
  };

  const handlePublishTemplate = () => {
    const publishedTemplate: FormTemplate = {
      ...template,
      status: 'published',
      version: template.status === 'published' ? template.version + 1 : template.version,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplate(publishedTemplate);
    setTemplates(prev => prev.map(t => t.id === publishedTemplate.id ? publishedTemplate : t));
    setShowPublishPanel(false);
    toast.success(`"${template.name}" published successfully (v${publishedTemplate.version})`);
  };

  const handleQuickAssign = () => {
    setShowAssignPanel(false);
    setViewMode('assignments');
    toast.info('Create an assignment rule to distribute this form to staff');
  };

  const handleSaveTemplateDetails = (updates: { name: string; description: string; headerImage?: string }) => {
    setTemplate(prev => ({
      ...prev,
      name: updates.name,
      description: updates.description,
      branding: { ...prev.branding, headerImage: updates.headerImage },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRestoreVersion = (restoredTemplate: FormTemplate) => {
    setTemplate(restoredTemplate);
    setTemplates(prev => {
      const exists = prev.find(t => t.id === restoredTemplate.id);
      return exists
        ? prev.map(t => t.id === restoredTemplate.id ? restoredTemplate : t)
        : [...prev, restoredTemplate];
    });
  };

  const handleDuplicateSection = (sectionId: string) => {
    const sectionToDuplicate = template.sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;
    const newSectionId = `section-${Date.now()}`;
    const newSection: FormSection = {
      ...sectionToDuplicate,
      id: newSectionId,
      title: `${sectionToDuplicate.title} (Copy)`,
      order: template.sections.length,
    };
    const fieldsInSection = template.fields.filter(f => f.sectionId === sectionId);
    const newFields: FormField[] = fieldsInSection.map((field, index) => ({
      ...field,
      id: `field-${Date.now()}-${index}`,
      sectionId: newSectionId,
    }));
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      fields: [...prev.fields, ...newFields],
    }));
    toast.success(`Section "${sectionToDuplicate.title}" duplicated`);
  };

  // Preview mode
  if (viewMode === 'preview' && previewTemplate) {
    return (
      <SurveyJSRenderer 
        template={previewTemplate} 
        onClose={() => { setPreviewTemplate(null); setViewMode('library'); }}
        onComplete={(results) => {
          console.log('Form submitted:', results);
          toast.success('Form submitted successfully');
        }}
      />
    );
  }

  // Top-level tabs for non-builder views
  const topTabs: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'assignments', label: 'Assignment Rules', icon: <Send size={16} /> },
    { key: 'submissions', label: 'Submissions', icon: <ClipboardCheck size={16} /> },
    { key: 'tasks', label: 'Tasks', icon: <ListTodo size={16} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
      <OfflineSyncStatusBar />

      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewMode === 'builder' && (
              <Button variant="ghost" size="sm" onClick={() => setViewMode('library')}>
                <ArrowLeft size={16} className="mr-1" /> Back
              </Button>
            )}
            {viewMode === 'builder' ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setShowEditDetailsPanel(true)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5"
                >
                  <h1 className="text-lg font-semibold text-foreground">{template?.name || 'Loading...'}</h1>
                  <Pencil size={14} className="text-muted-foreground" />
                </div>
                {template && (
                  <Chip
                    label={template.status}
                    size="small"
                    sx={{
                      textTransform: 'capitalize',
                      bgcolor: template.status === 'published' ? 'rgba(34, 197, 94, 0.12)' : template.status === 'draft' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(107, 114, 128, 0.1)',
                      color: template.status === 'published' ? 'rgb(21, 128, 61)' : template.status === 'draft' ? 'rgb(161, 98, 7)' : 'rgb(75, 85, 99)',
                    }}
                  />
                )}
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-semibold text-foreground">Forms</h1>
                <p className="text-sm text-muted-foreground">Manage Form Templates & Submissions</p>
              </div>
            )}
          </div>

          {/* Header actions */}
          {viewMode !== 'builder' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {}}>
                <FileText className="h-4 w-4 mr-1" /> More Options
              </Button>
              <Button size="sm" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-1" /> Create Template
              </Button>
            </div>
          )}

          {viewMode === 'builder' && template && (
            <div className="flex items-center gap-1">
              <Tooltip title="Undo (Ctrl+Z)">
                <span><IconButton size="small" onClick={undo} disabled={!canUndo}><Undo2 size={18} /></IconButton></span>
              </Tooltip>
              <Tooltip title="Redo (Ctrl+Y)">
                <span><IconButton size="small" onClick={redo} disabled={!canRedo}><Redo2 size={18} /></IconButton></span>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <MuiButton variant="text" size="small" startIcon={<Bookmark size={16} />} onClick={() => setShowFieldTemplates(true)}>Field Templates</MuiButton>
              <MuiButton variant="text" size="small" startIcon={<Braces size={16} />} onClick={() => setShowCustomTokens(true)}>Tokens</MuiButton>
              <MuiButton variant="text" size="small" startIcon={<Settings size={16} />} onClick={() => setShowSettingsPanel(true)}>Settings</MuiButton>
              <MuiButton variant="text" size="small" startIcon={<History size={16} />} onClick={() => setShowHistoryPanel(true)}>History</MuiButton>
              <MuiButton variant="outlined" size="small" startIcon={<Eye size={16} />} onClick={() => handlePreviewTemplate(template)}>Preview</MuiButton>
              <MuiButton variant="outlined" size="small" startIcon={<Save size={16} />} onClick={handleSaveTemplate}>Save</MuiButton>
              {template.status === 'draft' ? (
                <MuiButton variant="contained" size="small" startIcon={<Upload size={16} />} onClick={() => setShowPublishPanel(true)} disabled={template.fields.length === 0}>Publish</MuiButton>
              ) : (
                <MuiButton variant="contained" size="small" startIcon={<Users size={16} />} onClick={() => setShowAssignPanel(true)}>Assign</MuiButton>
              )}
            </div>
          )}
        </div>

        {/* Secondary Tab Navigation - only in non-builder, non-library views */}
        {viewMode !== 'builder' && viewMode !== 'library' && (
          <div className="flex items-center gap-1 mt-3 border-t border-border pt-3">
            <button
              onClick={() => setViewMode('library')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              ← Templates
            </button>
            {topTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleViewModeChange(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  viewMode === tab.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      {viewMode === 'library' && (
        <FormsListingPage
          templates={templates}
          onTemplatesChange={setTemplates}
          onSelectTemplate={handleSelectTemplate}
          onPreviewTemplate={handlePreviewTemplate}
          onCreateNew={handleCreateNew}
          onCreateFromSystemTemplate={(tmpl) => handleCreateFromSystemTemplate(tmpl)}
        />
      )}

      {viewMode === 'assignments' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}><FormAssignmentRules /></Box>
      )}

      {viewMode === 'submissions' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <SubmissionWorkflow
            initialSubmissionId={targetSubmissionId}
            onSubmissionViewed={() => setTargetSubmissionId(null)}
            onNavigateToTask={handleNavigateToTask}
          />
        </Box>
      )}

      {viewMode === 'tasks' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TaskManagementPanel
            onNavigateToSubmission={handleNavigateToSubmission}
            initialTaskId={targetTaskId}
            onTaskViewed={() => setTargetTaskId(null)}
          />
        </Box>
      )}

      {viewMode === 'analytics' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}><FormAnalyticsDashboard /></Box>
      )}

      {viewMode === 'builder' && template && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <SurveyJSCreator
            template={template}
            onTemplateChange={setTemplate}
            onSave={handleSaveTemplate}
          />
        </Box>
      )}

      {/* Drawers/Panels */}
      <EditTemplateDetailsDrawer
        open={showEditDetailsPanel}
        template={template}
        onClose={() => setShowEditDetailsPanel(false)}
        onSave={handleSaveTemplateDetails}
      />

      {/* Publish Panel */}
      <Drawer anchor="right" open={showPublishPanel} onClose={() => setShowPublishPanel(false)} PaperProps={{ sx: { width: 420 } }}>
        {template && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Upload size={18} />
                  <Typography variant="h6" fontWeight={600}>Publish Form Template</Typography>
                </Stack>
                <IconButton size="small" onClick={() => setShowPublishPanel(false)}><X size={18} /></IconButton>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
              <Stack spacing={3}>
                <Typography variant="body2" color="text.secondary">
                  Publishing this form will make it available for assignment to staff members.
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={500}>Template:</Typography>
                      <Typography variant="body2">{template.name}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={500}>Fields:</Typography>
                      <Typography variant="body2">{template.fields.length}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={500}>Version:</Typography>
                      <Chip label={`v${template.version}`} size="small" />
                    </Stack>
                  </Stack>
                </Box>
                {template.fields.length === 0 && (
                  <Alert severity="error" icon={<AlertCircle size={18} />}>Add at least one field before publishing.</Alert>
                )}
              </Stack>
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <MuiButton variant="text" onClick={() => setShowPublishPanel(false)}>Cancel</MuiButton>
                <MuiButton variant="contained" onClick={handlePublishTemplate} startIcon={<Check size={16} />} disabled={template.fields.length === 0}>Publish Now</MuiButton>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Assign Panel */}
      <Drawer anchor="right" open={showAssignPanel} onClose={() => setShowAssignPanel(false)} PaperProps={{ sx: { width: 420 } }}>
        {template && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Users size={18} />
                  <Typography variant="h6" fontWeight={600}>Assign Form</Typography>
                </Stack>
                <IconButton size="small" onClick={() => setShowAssignPanel(false)}><X size={18} /></IconButton>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
              <Typography variant="body2" color="text.secondary">
                Create an assignment rule to distribute "{template.name}" to staff.
              </Typography>
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <MuiButton variant="text" onClick={() => setShowAssignPanel(false)}>Cancel</MuiButton>
                <MuiButton variant="contained" onClick={handleQuickAssign} startIcon={<Send size={16} />}>Create Assignment Rule</MuiButton>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* History Panel */}
      <Drawer anchor="right" open={showHistoryPanel} onClose={() => setShowHistoryPanel(false)} PaperProps={{ sx: { width: 380 } }}>
        {template && (
          <FormVersionHistoryPanel
            currentTemplate={template}
            onRestore={handleRestoreVersion}
            onClose={() => setShowHistoryPanel(false)}
            onPreview={handlePreviewTemplate}
          />
        )}
      </Drawer>

      {/* Field Templates Library */}
      <FieldTemplatesLibrary
        open={showFieldTemplates}
        onClose={() => setShowFieldTemplates(false)}
        onAddField={(fieldConfig) => {
          const newField: FormField = {
            ...fieldConfig,
            id: `field-${Date.now()}`,
            order: template.fields.length,
            sectionId: template.sections[0]?.id,
          };
          setTemplate(prev => ({ ...prev, fields: [...prev.fields, newField] }));
          setSelectedFieldId(newField.id);
        }}
        currentField={selectedField}
      />

      {/* Token Manager */}
      <Drawer anchor="right" open={showCustomTokens} onClose={() => setShowCustomTokens(false)} PaperProps={{ sx: { width: 480 } }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>Tokens</Typography>
              <IconButton onClick={() => setShowCustomTokens(false)}><X size={20} /></IconButton>
            </Stack>
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
            <CustomTokenManager
              customTokens={customTokens}
              onTokensChange={setCustomTokens}
              mode={selectedFieldId ? 'insert' : 'copy'}
              onInsertToken={(token) => {
                if (selectedFieldId) {
                  const currentField = template.fields.find(f => f.id === selectedFieldId);
                  const currentValue = String(currentField?.defaultValue || '');
                  handleFieldUpdate(selectedFieldId, { defaultValue: currentValue + token });
                }
              }}
            />
          </Box>
        </Box>
      </Drawer>

      {/* Form Settings */}
      {template && (
        <FormSettingsDrawer
          open={showSettingsPanel}
          template={template}
          onClose={() => setShowSettingsPanel(false)}
          onSave={(updates) => {
            setTemplate(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
          }}
        />
      )}

      {/* Create Template Drawer */}
      <CreateTemplateDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        systemTemplates={templates.filter(t => t.scope === 'system')}
        onCreateFromScratch={handleCreateFromScratch}
        onCreateFromSystemTemplate={(tmpl, config) => handleCreateFromSystemTemplate(tmpl, config)}
        onPreviewTemplate={handlePreviewTemplate}
      />
    </div>
  );
}
