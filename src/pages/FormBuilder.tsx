import { useState } from 'react';
import { Box, Stack, Typography, Tab, Tabs, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
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
import { FormTemplate, FormField, FieldType, FIELD_TYPES } from '@/types/forms';
import { mockFormTemplates } from '@/data/mockFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Library, Send, Eye, ClipboardCheck, BarChart3, ListTodo, Save, Upload, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'library' | 'builder' | 'preview' | 'assignments' | 'submissions' | 'analytics' | 'tasks';

export default function FormBuilder() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [templates, setTemplates] = useState<FormTemplate[]>(mockFormTemplates);
  const [template, setTemplate] = useState<FormTemplate>(mockFormTemplates[0]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

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
    setShowPublishDialog(false);
    toast.success(`"${template.name}" published successfully (v${publishedTemplate.version})`);
  };

  const handleQuickAssign = () => {
    setShowAssignDialog(false);
    setViewMode('assignments');
    toast.info('Create an assignment rule to distribute this form to staff');
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
              <Button variant="ghost" size="sm" onClick={() => setViewMode('library')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Typography variant="h5" fontWeight={600}>
              {viewMode === 'builder' ? template.name : 'Form Management'}
            </Typography>
            {viewMode === 'builder' && (
              <Chip 
                label={template.status} 
                size="small"
                color={template.status === 'published' ? 'success' : template.status === 'draft' ? 'warning' : 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Stack>

          {viewMode === 'builder' && (
            <Stack direction="row" spacing={1}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePreviewTemplate(template)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveTemplate}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              {template.status === 'draft' ? (
                <Button 
                  size="sm"
                  onClick={() => setShowPublishDialog(true)}
                  disabled={template.fields.length === 0}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Publish
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Assign
                </Button>
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
                  <Library className="h-4 w-4" />
                  <span>Templates</span>
                </Stack>
              } 
            />
            <Tab 
              value="assignments" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Send className="h-4 w-4" />
                  <span>Assignment Rules</span>
                </Stack>
              } 
            />
            <Tab 
              value="submissions" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Submissions</span>
                </Stack>
              } 
            />
            <Tab 
              value="tasks" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ListTodo className="h-4 w-4" />
                  <span>Tasks</span>
                </Stack>
              } 
            />
            <Tab 
              value="analytics" 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BarChart3 className="h-4 w-4" />
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

      {viewMode === 'builder' && (
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
            />
          </Box>

          {/* Right: Properties */}
          <Box sx={{ width: 320, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <FormFieldProperties
              template={template}
              selectedFieldId={selectedFieldId}
              onFieldUpdate={handleFieldUpdate}
              onClose={() => setSelectedFieldId(null)}
            />
          </Box>
        </Box>
      )}

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onClose={() => setShowPublishDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Upload className="h-5 w-5" />
            <span>Publish Form Template</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Publishing this form will make it available for assignment to staff members. Once published, 
              any changes will create a new version while preserving previous submissions.
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={500}>Template:</Typography>
                  <Typography variant="body2">{template.name}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={500}>Sections:</Typography>
                  <Typography variant="body2">{template.sections.length}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={500}>Fields:</Typography>
                  <Typography variant="body2">{template.fields.length}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={500}>Version:</Typography>
                  <Typography variant="body2">v{template.version}</Typography>
                </Stack>
              </Stack>
            </Box>
            {template.fields.filter(f => f.required).length === 0 && (
              <Box sx={{ p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="caption" color="warning.dark">
                  ⚠️ This form has no required fields. Consider marking important fields as required.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onClick={() => setShowPublishDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublishTemplate}>
            <Check className="h-4 w-4 mr-1" />
            Publish Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Users className="h-5 w-5" />
            <span>Assign Form to Staff</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Create an assignment rule to automatically distribute "{template.name}" to staff members 
              based on triggers like shift start, schedules, or manual assignment.
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: 1, borderColor: 'primary.200' }}>
              <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>
                Assignment Options:
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">• Assign to specific staff or roles</Typography>
                <Typography variant="body2">• Trigger at shift start/end</Typography>
                <Typography variant="body2">• Schedule daily, weekly, or monthly</Typography>
                <Typography variant="body2">• Set due times and escalation rules</Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onClick={() => setShowAssignDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleQuickAssign}>
            <Send className="h-4 w-4 mr-1" />
            Create Assignment Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
