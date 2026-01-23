import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { FormBuilderCanvas } from '@/components/forms/FormBuilderCanvas';
import { FormFieldPalette } from '@/components/forms/FormFieldPalette';
import { FormFieldProperties } from '@/components/forms/FormFieldProperties';
import { FormTemplate, FormField, FieldType, FIELD_TYPES } from '@/types/forms';
import { mockFormTemplates } from '@/data/mockFormData';

export default function FormBuilder() {
  const [template, setTemplate] = useState<FormTemplate>(mockFormTemplates[0]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

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

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight={600}>Form Builder</Typography>
      </Box>

      {/* Main content */}
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
    </Box>
  );
}
