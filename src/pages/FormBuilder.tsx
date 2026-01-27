import { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Tab, 
  Tabs, 
  Chip, 
  IconButton, 
  TextField,
  Drawer,
  Divider,
  Button as MuiButton,
  Alert,
  Tooltip,
} from '@mui/material';
import { FormBuilderCanvas } from '@/components/forms/FormBuilderCanvas';
import { FormFieldPalette } from '@/components/forms/FormFieldPalette';
import { FormFieldProperties } from '@/components/forms/FormFieldProperties';
import { FormTemplatesLibrary } from '@/components/forms/FormTemplatesLibrary';
import { FormPreview } from '@/components/forms/FormPreview';
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
import { FormTemplate, FormField, FormSection, FieldType, FIELD_TYPES, AutoPopulateToken } from '@/types/forms';
import { mockFormTemplates } from '@/data/mockFormData';
import { templateDetailsSchema } from '@/lib/validationSchemas/formSchemas';
import { useFormBuilderUndoRedo } from '@/hooks/useFormBuilderUndoRedo';
import { 
  ArrowLeft, 
  Library, 
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
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'library' | 'builder' | 'preview' | 'assignments' | 'submissions' | 'analytics' | 'tasks';

export default function FormBuilder() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [templates, setTemplates] = useState<FormTemplate[]>(mockFormTemplates);
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
  // Removed editingName, editingDescription, validationErrors - now handled by EditTemplateDetailsDrawer

  // Undo/Redo for template state
  const {
    state: template,
    setState: setTemplate,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFormBuilderUndoRedo<FormTemplate>(mockFormTemplates[0]);

  // Get currently selected field
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
    sections: [
      { id: 'section-1', title: 'Section 1', order: 0 },
    ],
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

    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
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
    const newTemplate = createNewTemplate();
    setTemplate(newTemplate);
    setViewMode('builder');
    setSelectedFieldId(null);
  };

  const handleSaveTemplate = () => {
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
    setTemplate(updatedTemplate);
    setTemplates(prev => {
      const exists = prev.find(t => t.id === updatedTemplate.id);
      if (exists) {
        return prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
      }
      return [...prev, updatedTemplate];
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

  const handleOpenEditDetails = () => {
    setShowEditDetailsPanel(true);
  };

  const handleSaveTemplateDetails = (updates: { name: string; description: string; headerImage?: string }) => {
    setTemplate(prev => ({
      ...prev,
      name: updates.name,
      description: updates.description,
      branding: {
        ...prev.branding,
        headerImage: updates.headerImage,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRestoreVersion = (restoredTemplate: FormTemplate) => {
    setTemplate(restoredTemplate);
    setTemplates(prev => {
      const exists = prev.find(t => t.id === restoredTemplate.id);
      if (exists) {
        return prev.map(t => t.id === restoredTemplate.id ? restoredTemplate : t);
      }
      return [...prev, restoredTemplate];
    });
  };

  // Section duplication handler
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

    // Duplicate all fields in this section
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

    toast.success(`Section "${sectionToDuplicate.title}" duplicated with ${fieldsInSection.length} field(s)`);
  };

  // Preview mode
  if (viewMode === 'preview' && previewTemplate) {
    return (
      <FormPreview 
        template={previewTemplate} 
        onClose={() => {
          setPreviewTemplate(null);
          setViewMode('library');
        }}
        customTokens={customTokens}
      />
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Offline Status Bar */}
      <OfflineSyncStatusBar />

      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            {viewMode === 'builder' && (
              <MuiButton 
                variant="text" 
                size="small" 
                startIcon={<ArrowLeft size={16} />}
                onClick={() => setViewMode('library')}
              >
                Back
              </MuiButton>
            )}
            {viewMode === 'builder' ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box 
                  onClick={handleOpenEditDetails}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    },
                    p: 0.5,
                    mx: -0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography variant="h5" fontWeight={600}>
                    {template?.name || 'Loading...'}
                  </Typography>
                  <Pencil size={14} className="text-muted-foreground" />
                </Box>
              </Stack>
            ) : (
              <Typography variant="h5" fontWeight={600}>
                Form Management
              </Typography>
            )}
            {viewMode === 'builder' && template && (
              <Chip 
                label={template.status} 
                size="small"
                color={template.status === 'published' ? 'success' : template.status === 'draft' ? 'warning' : 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Stack>

          {viewMode === 'builder' && template && (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Undo/Redo buttons */}
              <Tooltip title="Undo (Ctrl+Z)">
                <span>
                  <IconButton 
                    size="small" 
                    onClick={undo} 
                    disabled={!canUndo}
                  >
                    <Undo2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Redo (Ctrl+Y)">
                <span>
                  <IconButton 
                    size="small" 
                    onClick={redo} 
                    disabled={!canRedo}
                  >
                    <Redo2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <MuiButton 
                variant="text" 
                size="small"
                startIcon={<Bookmark size={16} />}
                onClick={() => setShowFieldTemplates(true)}
              >
                Field Templates
              </MuiButton>
              <MuiButton 
                variant="text" 
                size="small"
                startIcon={<Braces size={16} />}
                onClick={() => setShowCustomTokens(true)}
              >
                Tokens
              </MuiButton>
              <MuiButton 
                variant="text" 
                size="small"
                startIcon={<Settings size={16} />}
                onClick={() => setShowSettingsPanel(true)}
              >
                Settings
              </MuiButton>
              <MuiButton 
                variant="text" 
                size="small"
                startIcon={<History size={16} />}
                onClick={() => setShowHistoryPanel(true)}
              >
                History
              </MuiButton>
              <MuiButton 
                variant="outlined" 
                size="small"
                startIcon={<Eye size={16} />}
                onClick={() => handlePreviewTemplate(template)}
              >
                Preview
              </MuiButton>
              <MuiButton 
                variant="outlined" 
                size="small"
                startIcon={<Save size={16} />}
                onClick={handleSaveTemplate}
              >
                Save
              </MuiButton>
              {template.status === 'draft' ? (
                <MuiButton 
                  variant="contained"
                  size="small"
                  startIcon={<Upload size={16} />}
                  onClick={() => setShowPublishPanel(true)}
                  disabled={template.fields.length === 0}
                >
                  Publish
                </MuiButton>
              ) : (
                <MuiButton 
                  variant="contained"
                  size="small"
                  startIcon={<Users size={16} />}
                  onClick={() => setShowAssignPanel(true)}
                >
                  Assign
                </MuiButton>
              )}
            </Stack>
          )}
        </Stack>

        {/* Tab Navigation */}
        {viewMode !== 'builder' && viewMode !== 'preview' && (
          <Tabs 
            value={viewMode} 
            onChange={(_, value) => setViewMode(value)}
            sx={{ mt: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              value="library" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Library size={16} />
                  <span>Templates</span>
                </Stack>
              } 
            />
            <Tab 
              value="assignments" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Send size={16} />
                  <span>Assignment Rules</span>
                </Stack>
              } 
            />
            <Tab 
              value="submissions" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ClipboardCheck size={16} />
                  <span>Submissions</span>
                </Stack>
              } 
            />
            <Tab 
              value="tasks" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ListTodo size={16} />
                  <span>Tasks</span>
                </Stack>
              } 
            />
            <Tab 
              value="analytics" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BarChart3 size={16} />
                  <span>Analytics</span>
                </Stack>
              } 
            />
          </Tabs>
        )}
      </Box>

      {/* Main content */}
      {viewMode === 'library' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <FormTemplatesLibrary 
            onSelectTemplate={handleSelectTemplate}
            onPreviewTemplate={handlePreviewTemplate}
            onCreateNew={handleCreateNew}
          />
        </Box>
      )}

      {viewMode === 'assignments' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <FormAssignmentRules />
        </Box>
      )}

      {viewMode === 'submissions' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <SubmissionWorkflow />
        </Box>
      )}

      {viewMode === 'tasks' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TaskManagementPanel />
        </Box>
      )}

      {viewMode === 'analytics' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <FormAnalyticsDashboard />
        </Box>
      )}

      {viewMode === 'builder' && template && (
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: Field Palette */}
          <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <FormFieldPalette onAddField={handleAddField} />
          </Box>

          {/* Center: Canvas */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <FormBuilderCanvas
              template={template}
              onTemplateChange={setTemplate}
              selectedFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
              onDuplicateSection={handleDuplicateSection}
            />
          </Box>

          {/* Right: Properties */}
          <Box sx={{ width: 320, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <FormFieldProperties
              template={template}
              selectedFieldId={selectedFieldId}
              onFieldUpdate={handleFieldUpdate}
              onClose={() => setSelectedFieldId(null)}
              customTokens={customTokens}
            />
          </Box>
        </Box>
      )}

      {/* Edit Details Side Panel */}
      <EditTemplateDetailsDrawer
        open={showEditDetailsPanel}
        template={template}
        onClose={() => setShowEditDetailsPanel(false)}
        onSave={handleSaveTemplateDetails}
      />

      {/* Publish Side Panel */}
      <Drawer
        anchor="right"
        open={showPublishPanel}
        onClose={() => setShowPublishPanel(false)}
        PaperProps={{ sx: { width: 420 } }}
      >
        {template && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Upload size={18} />
                <Typography variant="h6" fontWeight={600}>
                  Publish Form Template
                </Typography>
              </Stack>
              <IconButton size="small" onClick={() => setShowPublishPanel(false)}>
                <X size={18} />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">
                Publishing this form will make it available for assignment to staff members. Once published, 
                any changes will create a new version while preserving previous submissions.
              </Typography>

              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>Template:</Typography>
                    <Typography variant="body2">{template.name}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>Sections:</Typography>
                    <Typography variant="body2">{template.sections.length}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>Fields:</Typography>
                    <Typography variant="body2">{template.fields.length}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>Required Fields:</Typography>
                    <Typography variant="body2">{template.fields.filter(f => f.required).length}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>Version:</Typography>
                    <Chip label={`v${template.version}`} size="small" />
                  </Stack>
                </Stack>
              </Box>

              {template.fields.filter(f => f.required).length === 0 && (
                <Alert severity="warning" icon={<AlertCircle size={18} />}>
                  This form has no required fields. Consider marking important fields as required.
                </Alert>
              )}

              {template.fields.length === 0 && (
                <Alert severity="error" icon={<AlertCircle size={18} />}>
                  This form has no fields. Add at least one field before publishing.
                </Alert>
              )}
            </Stack>
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <MuiButton variant="text" onClick={() => setShowPublishPanel(false)}>
                Cancel
              </MuiButton>
              <MuiButton 
                variant="contained" 
                onClick={handlePublishTemplate}
                startIcon={<Check size={16} />}
                disabled={template.fields.length === 0}
              >
                Publish Now
              </MuiButton>
            </Stack>
          </Box>
        </Box>
        )}
      </Drawer>

      {/* Assign Side Panel */}
      <Drawer
        anchor="right"
        open={showAssignPanel}
        onClose={() => setShowAssignPanel(false)}
        PaperProps={{ sx: { width: 420 } }}
      >
        {template && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Users size={18} />
                <Typography variant="h6" fontWeight={600}>
                  Assign Form to Staff
                </Typography>
              </Stack>
              <IconButton size="small" onClick={() => setShowAssignPanel(false)}>
                <X size={18} />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">
                Create an assignment rule to automatically distribute "{template.name}" to staff members 
                based on triggers like shift start, schedules, or manual assignment.
              </Typography>

              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: 1, borderColor: 'primary.200' }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1.5 }}>
                  Assignment Options:
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Check size={14} className="text-primary" />
                    <Typography variant="body2">Assign to specific staff or roles</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Check size={14} className="text-primary" />
                    <Typography variant="body2">Trigger at shift start/end</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Check size={14} className="text-primary" />
                    <Typography variant="body2">Schedule daily, weekly, or monthly</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Check size={14} className="text-primary" />
                    <Typography variant="body2">Set due times and escalation rules</Typography>
                  </Stack>
                </Stack>
              </Box>

              <Alert severity="info">
                Assignment rules can be edited anytime from the "Assignment Rules" tab.
              </Alert>
            </Stack>
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <MuiButton variant="text" onClick={() => setShowAssignPanel(false)}>
                Cancel
              </MuiButton>
              <MuiButton 
                variant="contained" 
                onClick={handleQuickAssign}
                startIcon={<Send size={16} />}
              >
                Create Assignment Rule
              </MuiButton>
            </Stack>
          </Box>
        </Box>
        )}
      </Drawer>

      {/* History Side Panel */}
      <Drawer
        anchor="right"
        open={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        PaperProps={{ sx: { width: 380 } }}
      >
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
          setTemplate(prev => ({
            ...prev,
            fields: [...prev.fields, newField],
          }));
          setSelectedFieldId(newField.id);
        }}
        currentField={selectedField}
      />

      {/* Token Manager Drawer */}
      <Drawer
        anchor="right"
        open={showCustomTokens}
        onClose={() => setShowCustomTokens(false)}
        PaperProps={{ sx: { width: 480 } }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>
                Tokens
              </Typography>
              <IconButton onClick={() => setShowCustomTokens(false)}>
                <X size={20} />
              </IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedFieldId 
                ? 'Click a token to insert it into the selected field\'s default value, or copy to clipboard.'
                : 'Click a token to copy it to clipboard. Select a field first to enable direct insertion.'
              }
            </Typography>
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

      {/* Form Settings Drawer */}
      {template && (
        <FormSettingsDrawer
          open={showSettingsPanel}
          template={template}
          onClose={() => setShowSettingsPanel(false)}
          onSave={(updates) => {
            setTemplate(prev => ({
              ...prev,
              ...updates,
              updatedAt: new Date().toISOString(),
            }));
          }}
        />
      )}
    </Box>
  );
}
