import { useState } from 'react';
import { Box, Stack, Typography, Tab, Tabs } from '@mui/material';
import { FormBuilderCanvas } from '@/components/forms/FormBuilderCanvas';
import { FormFieldPalette } from '@/components/forms/FormFieldPalette';
import { FormFieldProperties } from '@/components/forms/FormFieldProperties';
import { FormTemplatesLibrary } from '@/components/forms/FormTemplatesLibrary';
import { FormPreview } from '@/components/forms/FormPreview';
import { FormAssignmentRules } from '@/components/forms/FormAssignmentRules';
import { FormTemplate, FormField, FieldType, FIELD_TYPES } from '@/types/forms';
import { mockFormTemplates } from '@/data/mockFormData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Library, PenTool, Send, Eye } from 'lucide-react';

type ViewMode = 'library' | 'builder' | 'preview' | 'assignments';

export default function FormBuilder() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [template, setTemplate] = useState<FormTemplate>(mockFormTemplates[0]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);

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
              {viewMode === 'library' && 'Form Management'}
              {viewMode === 'builder' && template.name}
              {viewMode === 'assignments' && 'Assignment Rules'}
            </Typography>
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
              <Button size="sm">
                Save Template
              </Button>
            </Stack>
          )}
        </Stack>

        {/* Tab Navigation (only show in library/assignments view) */}
        {viewMode !== 'builder' && viewMode !== 'preview' && (
          <Tabs 
            value={viewMode} 
            onChange={(_, value) => setViewMode(value)}
            sx={{ mt: 2 }}
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
          </Tabs>
        )}
      </Box>

      {/* Main content */}
      {viewMode === 'library' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <FormTemplatesLibrary 
            onSelectTemplate={handleSelectTemplate}
            onPreviewTemplate={handlePreviewTemplate}
          />
        </Box>
      )}

      {viewMode === 'assignments' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <FormAssignmentRules />
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
    </Box>
  );
}
